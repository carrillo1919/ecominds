import db from '../../../models/index.js';
import { assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import { enviarConfirmacionAsignacion, getDestinatariosAsignacion } from '../../notificaciones/index.js';

const { EmpresaServicio, Producto, Servicio, Empresa, CalendarioEvento, Factura, Sequelize } = db;
const { Op } = Sequelize;

const INCLUDES = [
  { model: Producto, as: 'producto' },
  { model: Servicio, as: 'servicio' },
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
];

const INCLUDES_FULL = [...INCLUDES, { model: Factura, as: 'factura', attributes: ['id', 'numero', 'estado'] }];

export const calcularTotales = (cantidad, precioUnitario, impuesto) => {
  const qty = Number(cantidad) || 0;
  const unit = Number(precioUnitario) || 0;
  const taxRate = Number(impuesto) || 0;
  const subtotal = qty * unit;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const buildCalendarioEvento = (asignacion, itemNombre, empresaNombre) => {
  const fecha = asignacion.fechaEntrega || asignacion.fechaEjecucion;
  if (!fecha) return null;
  const tipo = asignacion.productoId ? 'producto' : 'servicio';
  return {
    titulo: `${tipo === 'producto' ? 'Entrega' : 'Ejecución'}: ${itemNombre}`,
    descripcion: `Asignación para ${empresaNombre}`,
    fecha,
    tipo,
    color: tipo === 'producto' ? '#0ea5e9' : '#8b5cf6',
    empresaId: asignacion.empresaId,
    empresaServicioId: asignacion.id,
  };
};

export const listarAsignaciones = async (req) => {
  const { empresaId, estado, facturado } = req.query;
  const where = {};

  if (estado) where.estado = estado;
  if (empresaId) {
    assertEmpresaInScope(empresaId, req);
    where.empresaId = empresaId;
  }
  if (facturado === 'true') where.facturaId = { [Op.ne]: null };
  if (facturado === 'false') where.facturaId = null;

  return EmpresaServicio.findAll({
    where,
    include: INCLUDES_FULL,
    order: [['createdAt', 'DESC']],
  });
};

export const crearAsignacion = async (req) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      empresaId, productoId, servicioId, cantidad, precioUnitario, impuesto,
      fechaEjecucion, fechaEntrega, observaciones,
    } = req.body;

    assertEmpresaInScope(empresaId, req);

    let item;
    let itemNombre;
    if (productoId) {
      item = await Producto.findByPk(productoId, { transaction });
      if (!item) {
        throw new HttpError(404, 'Producto no encontrado');
      }
      itemNombre = item.nombre;
    } else {
      item = await Servicio.findByPk(servicioId, { transaction });
      if (!item) {
        throw new HttpError(404, 'Servicio no encontrado');
      }
      itemNombre = item.nombre;
    }

    const finalPrecio = precioUnitario !== undefined ? precioUnitario : item.precio;
    const finalImpuesto = impuesto !== undefined ? impuesto : item.impuesto;
    const { total } = calcularTotales(cantidad, finalPrecio, finalImpuesto);
    const esProducto = Boolean(productoId);

    const asignacion = await EmpresaServicio.create({
      empresaId,
      productoId: productoId || null,
      servicioId: servicioId || null,
      cantidad,
      precioUnitario: finalPrecio,
      impuesto: finalImpuesto,
      precioTotal: total,
      fechaEjecucion: esProducto ? null : fechaEjecucion || null,
      fechaEntrega: esProducto ? fechaEntrega || null : null,
      observaciones,
    }, { transaction });

    await asignacion.reload({ transaction, include: INCLUDES });

    const eventoData = buildCalendarioEvento(asignacion, itemNombre, asignacion.empresa?.nombre || '');
    if (eventoData) {
      await CalendarioEvento.create(eventoData, { transaction });
    }

    await transaction.commit();

    const destinatarios = await getDestinatariosAsignacion(asignacion);
    if (destinatarios.length) {
      await enviarConfirmacionAsignacion(asignacion, destinatarios);
    }

    return asignacion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const actualizarAsignacion = async (id, req) => {
  const transaction = await db.sequelize.transaction();
  try {
    const asignacion = await EmpresaServicio.findByPk(id, {
      include: [{ model: Producto, as: 'producto' }, { model: Servicio, as: 'servicio' }],
    });
    if (!asignacion) {
      throw new HttpError(404, 'Asignación no encontrada');
    }
    assertEmpresaInScope(asignacion.empresaId, req);

    const camposPermitidos = ['cantidad', 'precioUnitario', 'impuesto', 'estado', 'observaciones'];
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) asignacion[campo] = req.body[campo];
    });

    if (asignacion.productoId) {
      if (req.body.fechaEntrega !== undefined) asignacion.fechaEntrega = req.body.fechaEntrega || null;
      asignacion.fechaEjecucion = null;
    } else {
      if (req.body.fechaEjecucion !== undefined) asignacion.fechaEjecucion = req.body.fechaEjecucion || null;
      asignacion.fechaEntrega = null;
    }

    const { total } = calcularTotales(asignacion.cantidad, asignacion.precioUnitario, asignacion.impuesto);
    asignacion.precioTotal = total;
    await asignacion.save({ transaction });

    const itemNombre = asignacion.producto?.nombre || asignacion.servicio?.nombre || 'Item';
    const [evento] = await CalendarioEvento.findAll({
      where: { empresaServicioId: asignacion.id },
      transaction,
    });

    const eventoData = buildCalendarioEvento(asignacion, itemNombre, asignacion.empresa?.nombre || '');
    if (eventoData) {
      if (evento) {
        await evento.update(eventoData, { transaction });
      } else {
        await CalendarioEvento.create(eventoData, { transaction });
      }
    } else if (evento) {
      await evento.destroy({ transaction });
    }

    await transaction.commit();
    await asignacion.reload({ include: INCLUDES });

    return asignacion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const cancelarAsignacion = async (id, req) => {
  const asignacion = await EmpresaServicio.findByPk(id);
  if (!asignacion) {
    throw new HttpError(404, 'Asignación no encontrada');
  }
  assertEmpresaInScope(asignacion.empresaId, req);
  await asignacion.update({ estado: 'cancelado' });
};