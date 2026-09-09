import { format } from 'date-fns';
import db from '../models/index.js';

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
