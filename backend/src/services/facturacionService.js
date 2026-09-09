import { format } from 'date-fns';
import PDFDocument from 'pdfkit';
import db from '../models/index.js';
import { sendEmailWithTemplate } from './emailService.js';

const { Factura, FacturaItem, EmpresaServicio } = db;

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

const generarPdfFactura = (factura) => new Promise((resolve, reject) => {
  const documento = new PDFDocument({ margin: 50, size: 'A4' });
  const partes = [];
  documento.on('data', (parte) => partes.push(parte));
  documento.on('end', () => resolve(Buffer.concat(partes)));
  documento.on('error', reject);

  documento.fontSize(22).fillColor('#14532d').text('EcoMinds', { align: 'right' });
  documento.fontSize(11).fillColor('#334155').text('Auditoria ambiental', { align: 'right' });
  documento.moveDown(2);
  documento.fontSize(20).fillColor('#111827').text(`Factura ${factura.numero}`);
  documento.moveDown(0.5);
  documento.fontSize(10).fillColor('#374151');
  documento.text(`Empresa: ${factura.empresa?.nombre || 'No disponible'}`);
  if (factura.empresa?.rif) documento.text(`RIF: ${factura.empresa.rif}`);
  documento.text(`Fecha de emision: ${factura.fechaEmision}`);
  if (factura.fechaVencimiento) documento.text(`Fecha de vencimiento: ${factura.fechaVencimiento}`);
  documento.moveDown();

  const columnas = { descripcion: 50, cantidad: 320, unitario: 390, total: 470 };
  documento.fontSize(10).fillColor('#14532d');
  documento.text('Descripcion', columnas.descripcion, documento.y);
  documento.text('Cantidad', columnas.cantidad, documento.y - 12);
  documento.text('Precio unit.', columnas.unitario, documento.y - 12);
  documento.text('Total', columnas.total, documento.y - 12);
  documento.moveTo(50, documento.y + 4).lineTo(545, documento.y + 4).stroke('#94a3b8');
  documento.moveDown();

  factura.items.forEach((item) => {
    if (documento.y > 710) documento.addPage();
    const posicionY = documento.y;
    documento.fillColor('#111827').text(item.descripcion, columnas.descripcion, posicionY, { width: 255 });
    documento.text(formatoMonto(item.cantidad), columnas.cantidad, posicionY, { width: 60, align: 'right' });
    documento.text(formatoMonto(item.precioUnitario), columnas.unitario, posicionY, { width: 70, align: 'right' });
    documento.text(formatoMonto(item.total), columnas.total, posicionY, { width: 70, align: 'right' });
    documento.moveDown();
  });

  documento.moveDown();
  documento.fontSize(11).fillColor('#111827');
  documento.text(`Subtotal: ${formatoMonto(factura.subtotal)}`, { align: 'right' });
  documento.text(`Impuesto: ${formatoMonto(factura.impuesto)}`, { align: 'right' });
  documento.fontSize(13).fillColor('#14532d').text(`Total: ${formatoMonto(factura.total)}`, { align: 'right' });
  if (factura.notas) {
    documento.moveDown(2);
    documento.fontSize(10).fillColor('#374151').text(`Notas: ${factura.notas}`);
  }
  documento.end();
});

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

const enviarFacturaPorCorreo = async (factura, { subject, title, message }) => {
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
      return await sendEmailWithTemplate({
        to,
        subject,
        title,
        message: message(empresa),
        attachments: adjunto ? [adjunto] : [],
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }));
};

export const enviarFacturaEmitida = async (factura) => enviarFacturaPorCorreo(factura, {
  subject: `Factura ${factura.numero} emitida`,
  title: `Factura ${factura.numero}`,
  message: (empresa) => `<p>Se ha emitido una factura para <strong>${empresa?.nombre || 'su empresa'}</strong>.</p><p><strong>Total:</strong> ${formatoMonto(factura.total)}</p><p>La factura se encuentra adjunta a este correo.</p>`,
});

export const enviarFacturaPagada = async (factura) => enviarFacturaPorCorreo(factura, {
  subject: `Factura ${factura.numero} pagada`,
  title: `Pago recibido: factura ${factura.numero}`,
  message: (empresa) => `<p>La factura de <strong>${empresa?.nombre || 'su empresa'}</strong> ha sido marcada como <strong>pagada</strong>.</p><p><strong>Fecha de pago:</strong> ${factura.fechaPago}</p><p><strong>Método de pago:</strong> ${factura.metodoPago?.replace('_', ' ') || 'No especificado'}</p><p><strong>Total pagado:</strong> ${formatoMonto(factura.montoPago || factura.total)}</p><p>La factura se encuentra adjunta a este correo.</p>`,
});
