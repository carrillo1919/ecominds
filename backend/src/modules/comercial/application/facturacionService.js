import { format } from 'date-fns';
import db from '../../../models/index.js';
import { assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import { enviarCorreoFacturaEmitida, enviarCorreoFacturaPagada } from './emailService.js';
import { construirPdfFactura } from '../infrastructure/pdf/factura.js';

const { Factura, FacturaItem, EmpresaServicio, Empresa, Producto, Servicio } = db;

const INCLUDES_LISTA = [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }];

const INCLUDES_DETALLE = [
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'direccion', 'telefono', 'email'] },
  {
    model: FacturaItem,
    as: 'items',
    include: [
      {
        model: EmpresaServicio,
        as: 'empresaServicio',
        include: [
          { model: Producto, as: 'producto' },
          { model: Servicio, as: 'servicio' },
        ],
      },
    ],
  },
];

const conTienePdf = (factura) => ({
  ...factura.toJSON(),
  tienePdf: Boolean(factura.pdfNombreArchivo),
});

export const listarFacturas = async (req) => {
  const { empresaId, estado } = req.query;
  const where = {};
  if (estado) where.estado = estado;
  if (empresaId) {
    assertEmpresaInScope(empresaId, req);
    where.empresaId = empresaId;
  }

  const facturas = await Factura.findAll({
    where,
    attributes: { exclude: ['pdfContenido'] },
    include: INCLUDES_LISTA,
    order: [['createdAt', 'DESC']],
  });

  return facturas.map(conTienePdf);
};

export const obtenerFactura = async (id, req) => {
  const factura = await Factura.findByPk(id, {
    attributes: { exclude: ['pdfContenido'] },
    include: INCLUDES_DETALLE,
  });
  if (!factura) {
    throw new HttpError(404, 'Factura no encontrada');
  }
  assertEmpresaInScope(factura.empresaId, req);
  return conTienePdf(factura);
};

export const actualizarFactura = async (id, req) => {
  const factura = await Factura.findByPk(id);
  if (!factura) {
    throw new HttpError(404, 'Factura no encontrada');
  }
  assertEmpresaInScope(factura.empresaId, req);

  const camposPermitidos = ['fechaVencimiento', 'notas'];
  camposPermitidos.forEach((campo) => {
    if (req.body[campo] !== undefined) factura[campo] = req.body[campo];
  });
  await factura.save();
  return factura;
};

export const anularFactura = async (id, req) => {
  const factura = await Factura.findByPk(id);
  if (!factura) {
    throw new HttpError(404, 'Factura no encontrada');
  }
  assertEmpresaInScope(factura.empresaId, req);
  await cambiarEstadoFactura(factura.id, 'anulada');
};

export const obtenerPdfFactura = async (id, req) => {
  const factura = await Factura.findByPk(id, {
    attributes: ['id', 'empresaId', 'pdfNombreArchivo', 'pdfContenido'],
  });
  if (!factura) {
    throw new HttpError(404, 'Factura no encontrada');
  }
  assertEmpresaInScope(factura.empresaId, req);
  if (!factura.pdfContenido) {
    throw new HttpError(404, 'La factura aún no tiene un PDF generado');
  }
  return {
    contenido: factura.pdfContenido,
    nombreArchivo: factura.pdfNombreArchivo || `factura-${factura.id}.pdf`,
  };
};

// Cambia el estado de la factura aplicando las reglas de negocio de emisión y pago.
export const cambiarEstadoConReglas = async (id, req) => {
  const { estado, fechaPago, metodoPago, referenciaPago, bancoPago, telefonoPago, montoPago } = req.body;
  const factura = await Factura.findByPk(id);
  if (!factura) {
    throw new HttpError(404, 'Factura no encontrada');
  }
  assertEmpresaInScope(factura.empresaId, req);

  if (estado === 'emitida') {
    const facturaEmitida = await emitirFactura(factura.id);
    const resultadosCorreo = await enviarFacturaEmitida(facturaEmitida);
    const erroresCorreo = resultadosCorreo.filter((resultado) => !resultado.success).length;
    return {
      message: erroresCorreo
        ? 'Factura emitida, pero no se pudo enviar a todos los destinatarios'
        : 'Factura emitida y enviada por correo',
      factura: { ...facturaEmitida.toJSON(), pdfContenido: undefined, tienePdf: true },
    };
  }

  if (estado === 'pagada') {
    if (factura.estado !== 'emitida') {
      throw new HttpError(422, 'Solo se pueden registrar pagos para facturas emitidas');
    }
    const montoNormalizado = Number(montoPago);
    if (!fechaPago || !metodoPago || !Number.isFinite(montoNormalizado) || montoNormalizado <= 0) {
      throw new HttpError(422, 'fechaPago, metodoPago y montoPago son obligatorios');
    }
    if (Math.abs(montoNormalizado - Number(factura.total)) > 0.01) {
      throw new HttpError(422, 'El monto pagado debe coincidir con el total de la factura');
    }

    const facturaActualizada = await cambiarEstadoFactura(factura.id, estado);
    await facturaActualizada.update({
      fechaPago,
      metodoPago,
      referenciaPago: referenciaPago?.trim() || null,
      bancoPago: bancoPago?.trim() || null,
      telefonoPago: telefonoPago?.trim() || null,
      montoPago: montoNormalizado,
    });
    const resultadosCorreo = await enviarFacturaPagada(facturaActualizada);
    const erroresCorreo = resultadosCorreo.filter((resultado) => !resultado.success).length;
    return {
      message: erroresCorreo
        ? 'Factura marcada como pagada, pero no se pudo enviar a todos los destinatarios'
        : 'Factura marcada como pagada y enviada por correo',
      factura: { ...facturaActualizada.toJSON(), pdfContenido: undefined, tienePdf: Boolean(facturaActualizada.pdfNombreArchivo) },
    };
  }

  const facturaActualizada = await cambiarEstadoFactura(factura.id, estado);
  return {
    message: 'Estado actualizado',
    factura: { ...facturaActualizada.toJSON(), pdfContenido: undefined, tienePdf: Boolean(facturaActualizada.pdfNombreArchivo) },
  };
};

const calcularItem = (cantidad, precioUnitario, impuesto) => {
  const qty = Number(cantidad) || 0;
  const unit = Number(precioUnitario) || 0;
  const taxRate = Number(impuesto) || 0;
  const subtotal = qty * unit;
  const tax = subtotal * (taxRate / 100);
  return {
    cantidad: qty,
    precioUnitario: unit,
    impuesto: taxRate,
    subtotal,
    total: subtotal + tax,
  };
};

export const generarNumeroFactura = async (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const prefix = `F${anio}-`;
  const ultima = await Factura.findOne({
    where: { numero: { [db.Sequelize.Op.like]: `${prefix}%` } },
    order: [['numero', 'DESC']],
  });
  const secuencia = ultima ? parseInt(ultima.numero.split('-')[1], 10) + 1 : 1;
  return `${prefix}${String(secuencia).padStart(6, '0')}`;
};

export const generarFacturaDesdeAsignaciones = async ({ empresaId, asignacionIds, fechaVencimiento, notas }) => {
  const transaction = await db.sequelize.transaction();
  try {
    const asignaciones = await EmpresaServicio.findAll({
      where: {
        id: { [db.Sequelize.Op.in]: asignacionIds },
        empresaId,
        estado: 'pendiente',
        facturaId: null,
      },
      include: [
        { model: db.Producto, as: 'producto' },
        { model: db.Servicio, as: 'servicio' },
      ],
      transaction,
    });

    if (!asignaciones.length) {
      throw new Error('No hay asignaciones pendientes disponibles para facturar');
    }

    let subtotal = 0;
    let impuesto = 0;
    const items = [];

    for (const asignacion of asignaciones) {
      const nombre = asignacion.producto?.nombre || asignacion.servicio?.nombre || 'Item';
      const tipo = asignacion.productoId ? 'Producto' : 'Servicio';
      const itemCalc = calcularItem(asignacion.cantidad, asignacion.precioUnitario, asignacion.impuesto);
      subtotal += itemCalc.subtotal;
      impuesto += itemCalc.total - itemCalc.subtotal;
      items.push({
        empresaServicioId: asignacion.id,
        descripcion: `${tipo}: ${nombre}`,
        ...itemCalc,
      });
    }

    const total = subtotal + impuesto;
    const fechaEmision = format(new Date(), 'yyyy-MM-dd');
    const numero = await generarNumeroFactura();

    const factura = await Factura.create({
      numero,
      empresaId,
      fechaEmision,
      fechaVencimiento: fechaVencimiento || null,
      subtotal,
      impuesto,
      total,
      estado: 'borrador',
      notas,
    }, { transaction });

    await FacturaItem.bulkCreate(
      items.map((item) => ({ ...item, facturaId: factura.id })),
      { transaction }
    );

    await EmpresaServicio.update(
      { estado: 'facturado', facturaId: factura.id },
      { where: { id: { [db.Sequelize.Op.in]: asignaciones.map((a) => a.id) } }, transaction }
    );

    await transaction.commit();
    return factura;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const cambiarEstadoFactura = async (facturaId, nuevoEstado) => {
  const estadosPermitidos = Factura.ESTADOS || ['borrador', 'emitida', 'pagada', 'anulada'];
  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error(`Estado no válido: ${nuevoEstado}`);
  }

  const factura = await Factura.findByPk(facturaId);
  if (!factura) throw new Error('Factura no encontrada');

  if (nuevoEstado === 'anulada' && factura.estado !== 'anulada') {
    await EmpresaServicio.update(
      { estado: 'pendiente', facturaId: null },
      { where: { facturaId } }
    );
  }

  await factura.update({ estado: nuevoEstado });
  return factura;
};

const formatoMonto = (monto) => Number(monto || 0).toFixed(2);

const generarPdfFactura = (factura) => construirPdfFactura(factura);

export const emitirFactura = async (facturaId) => {
  const factura = await Factura.findByPk(facturaId, {
    include: [
      { model: db.Empresa, as: 'empresa', include: [{ model: db.Empleado, as: 'responsableEmpleado', attributes: ['id', 'nombre', 'apellido', 'email'] }] },
      { model: db.FacturaItem, as: 'items' },
    ],
  });
  if (!factura) throw new Error('Factura no encontrada');
  if (factura.estado !== 'borrador') throw new Error('Solo se pueden emitir facturas en borrador');

  const pdfContenido = await generarPdfFactura(factura);
  const pdfNombreArchivo = `factura-${factura.numero}.pdf`;
  await factura.update({ estado: 'emitida', pdfNombreArchivo, pdfContenido });
  return factura;
};

const enviarFacturaPorCorreo = async (factura, { subject, enviar, datos }) => {
  const empresa = factura.empresa || await db.Empresa.findByPk(factura.empresaId, {
    include: [{ model: db.Empleado, as: 'responsableEmpleado', attributes: ['email'] }],
  });
  const destinatarios = [...new Set([
    empresa?.responsableEmpleado?.email || empresa?.email,
    process.env.ADMIN_EMAIL,
  ].filter(Boolean))];
  const adjunto = factura.pdfContenido && {
    filename: factura.pdfNombreArchivo || `factura-${factura.numero}.pdf`,
    content: factura.pdfContenido,
    contentType: 'application/pdf',
  };

  return Promise.all(destinatarios.map(async (to) => {
    try {
      return await enviar({
        destinatario: to,
        numero: factura.numero,
        empresaNombre: empresa?.nombre || 'su empresa',
        subject,
        attachments: adjunto ? [adjunto] : [],
        ...datos(empresa),
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }));
};

export const enviarFacturaEmitida = async (factura) => enviarFacturaPorCorreo(factura, {
  subject: `Factura ${factura.numero} emitida`,
  enviar: enviarCorreoFacturaEmitida,
  datos: (empresa) => ({
    total: formatoMonto(factura.total),
  }),
});

export const enviarFacturaPagada = async (factura) => enviarFacturaPorCorreo(factura, {
  subject: `Factura ${factura.numero} pagada`,
  enviar: enviarCorreoFacturaPagada,
  datos: (empresa) => ({
    fechaPago: factura.fechaPago,
    metodoPago: factura.metodoPago?.replace('_', ' ') || 'No especificado',
    totalPagado: formatoMonto(factura.montoPago || factura.total),
  }),
});