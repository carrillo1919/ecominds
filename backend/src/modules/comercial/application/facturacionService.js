import { format } from 'date-fns';
import db from '../../../models/index.js';
import { assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import { enviarCorreoFacturaEmitida, enviarCorreoFacturaPagada } from './emailService.js';
import { construirPdfFactura } from '../infrastructure/pdf/factura.js';

const { Factura, FacturaItem, FacturaConcepto, ConfiguracionFactura, EmpresaServicio, Empresa, Producto, Servicio } = db;

const INCLUDES_LISTA = [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }];

const INCLUDES_DETALLE = [
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'direccion', 'telefono', 'email'] },
  { model: FacturaConcepto, as: 'conceptos' },
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

// Redondeo monetario a 2 decimales evitando el sesgo binario de los flotantes.
export const redondear = (valor) => Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

// Reparte un monto entre varios pesos proporcionales ajustando la diferencia
// de redondeo en el de mayor peso, de forma que la suma sea exacta.
export const distribuirProporcional = (total, pesos) => {
  if (!pesos.length) return [];

  const monto = redondear(total);
  const sumaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  if (!monto || !sumaPesos) return pesos.map(() => 0);

  const partes = pesos.map((peso) => redondear((monto * peso) / sumaPesos));
  const diferencia = redondear(monto - partes.reduce((acc, parte) => acc + parte, 0));
  if (diferencia) {
    const indiceMayor = pesos.reduce((mayor, peso, indice) => (peso > pesos[mayor] ? indice : mayor), 0);
    partes[indiceMayor] = redondear(partes[indiceMayor] + diferencia);
  }
  return partes;
};

const comoConcepto = (configuracion) => ({
  id: configuracion.id,
  tipo: configuracion.tipo,
  nombre: configuracion.nombre,
  porcentaje: Number(configuracion.porcentaje) || 0,
  descripcion: configuracion.descripcion || null,
});

const porcentajeDe = (concepto) => Number(concepto.porcentaje) || 0;

/**
 * Calcula los items, impuestos y descuentos de una factura.
 * Los descuentos se aplican en cascada sobre el monto que va quedando y luego
 * se reparten proporcionalmente entre los items; los impuestos se aplican a la
 * base ya descontada. Así el total de la factura siempre coincide con la suma
 * de los totales de sus items.
 */
export const calcularFactura = ({ items: lineas, impuestos = [], descuentos = [] }) => {
  const itemsBase = lineas.map((linea) => {
    const cantidad = Number(linea.cantidad) || 0;
    const precioUnitario = Number(linea.precioUnitario) || 0;
    return { ...linea, cantidad, precioUnitario, subtotal: redondear(cantidad * precioUnitario) };
  });

  const subtotal = redondear(itemsBase.reduce((acc, item) => acc + item.subtotal, 0));

  let baseDescuento = subtotal;
  const conceptosDescuento = descuentos.map((descuento) => {
    const porcentaje = porcentajeDe(descuento);
    const monto = redondear(baseDescuento * (porcentaje / 100));
    baseDescuento = redondear(baseDescuento - monto);
    return { ...descuento, porcentaje, monto };
  });
  const descuento = redondear(subtotal - baseDescuento);

  const partesDescuento = distribuirProporcional(descuento, itemsBase.map((item) => item.subtotal));
  const tasaTotal = redondear(impuestos.reduce((acc, impuesto) => acc + porcentajeDe(impuesto), 0));

  const items = itemsBase.map((item, indice) => {
    const descuentoItem = partesDescuento[indice];
    const base = redondear(item.subtotal - descuentoItem);
    const montoImpuesto = redondear(base * (tasaTotal / 100));
    return {
      ...item,
      impuesto: tasaTotal,
      descuento: descuentoItem,
      total: redondear(base + montoImpuesto),
    };
  });

  const impuesto = redondear(items.reduce(
    (acc, item) => acc + (item.total - item.subtotal + item.descuento),
    0
  ));

  const partesImpuesto = distribuirProporcional(impuesto, impuestos.map(porcentajeDe));
  const conceptosImpuesto = impuestos.map((item, indice) => ({
    ...item,
    porcentaje: porcentajeDe(item),
    monto: partesImpuesto[indice],
  }));

  return {
    items,
    conceptos: [...conceptosDescuento, ...conceptosImpuesto],
    subtotal,
    descuento,
    impuesto,
    total: redondear(subtotal - descuento + impuesto),
  };
};

const cargarConceptos = async (ids, tipo, transaction) => {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return [];

  const configuraciones = await ConfiguracionFactura.findAll({
    where: { id: { [db.Sequelize.Op.in]: unicos }, tipo, activo: true },
    transaction,
  });
  if (configuraciones.length !== unicos.length) {
    throw new HttpError(422, 'Algún impuesto o descuento seleccionado no está disponible');
  }

  const porId = new Map(configuraciones.map((configuracion) => [configuracion.id, configuracion]));
  return unicos.map((id) => comoConcepto(porId.get(id)));
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

export const generarFacturaDesdeAsignaciones = async ({
  empresaId, asignacionIds, fechaVencimiento, notas, impuestoIds = [], descuentoIds = [],
}) => {
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

    const impuestos = await cargarConceptos(impuestoIds, 'impuesto', transaction);
    const descuentos = await cargarConceptos(descuentoIds, 'descuento', transaction);

    const lineas = asignaciones.map((asignacion) => {
      const nombre = asignacion.producto?.nombre || asignacion.servicio?.nombre || 'Item';
      const tipo = asignacion.productoId ? 'Producto' : 'Servicio';
      return {
        empresaServicioId: asignacion.id,
        descripcion: `${tipo}: ${nombre}`,
        unidadMedida: asignacion.unidadMedida || asignacion.producto?.unidadMedida
          || asignacion.servicio?.unidadMedida || null,
        cantidad: asignacion.cantidad,
        precioUnitario: asignacion.precioUnitario,
      };
    });

    const calculo = calcularFactura({ items: lineas, impuestos, descuentos });
    const fechaEmision = format(new Date(), 'yyyy-MM-dd');
    const numero = await generarNumeroFactura();

    const factura = await Factura.create({
      numero,
      empresaId,
      fechaEmision,
      fechaVencimiento: fechaVencimiento || null,
      subtotal: calculo.subtotal,
      descuento: calculo.descuento,
      impuesto: calculo.impuesto,
      total: calculo.total,
      estado: 'borrador',
      notas,
    }, { transaction });

    await FacturaItem.bulkCreate(
      calculo.items.map((item) => ({ ...item, facturaId: factura.id })),
      { transaction }
    );

    if (calculo.conceptos.length) {
      await FacturaConcepto.bulkCreate(
        calculo.conceptos.map((concepto) => ({
          facturaId: factura.id,
          configuracionId: concepto.id,
          tipo: concepto.tipo,
          nombre: concepto.nombre,
          porcentaje: concepto.porcentaje,
          descripcion: concepto.descripcion,
          monto: concepto.monto,
        })),
        { transaction }
      );
    }

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
      { model: db.FacturaConcepto, as: 'conceptos' },
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