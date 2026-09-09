import db from '../models/index.js';
import { assertEmpresaInScope } from '../utils/empresaScope.js';
import { enviarConfirmacionAsignacion, getDestinatariosAsignacion } from '../services/notificacionServicioService.js';

const { EmpresaServicio, Producto, Servicio, Empresa, CalendarioEvento } = db;

const calcularTotales = (cantidad, precioUnitario, impuesto) => {
  const qty = Number(cantidad) || 0;
  const unit = Number(precioUnitario) || 0;
  const taxRate = Number(impuesto) || 0;
  const subtotal = qty * unit;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

const buildCalendarioEvento = (asignacion, itemNombre, empresaNombre) => {
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

export const getAll = async (req, res, next) => {
  try {
    const { empresaId, estado, facturado } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (empresaId) {
      assertEmpresaInScope(empresaId, req);
      where.empresaId = empresaId;
    }
    if (facturado === 'true') where.facturaId = { [db.Sequelize.Op.ne]: null };
    if (facturado === 'false') where.facturaId = null;

    const asignaciones = await EmpresaServicio.findAll({
      where,
      include: [
        { model: Producto, as: 'producto' },
        { model: Servicio, as: 'servicio' },
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
        { model: db.Factura, as: 'factura', attributes: ['id', 'numero', 'estado'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ asignaciones });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      empresaId, productoId, servicioId, cantidad, precioUnitario, impuesto,
      fechaEjecucion, fechaEntrega, observaciones,
    } = req.body;

    if (!empresaId) throw new Error('empresaId es obligatorio');
    if (!productoId && !servicioId) throw new Error('Debe indicar productoId o servicioId');
    if (productoId && servicioId) throw new Error('Solo puede indicar productoId o servicioId, no ambos');

    assertEmpresaInScope(empresaId, req);

    let item;
    let itemNombre;
    if (productoId) {
      item = await Producto.findByPk(productoId, { transaction });
      if (!item) throw new Error('Producto no encontrado');
      itemNombre = item.nombre;
    } else {
      item = await Servicio.findByPk(servicioId, { transaction });
      if (!item) throw new Error('Servicio no encontrado');
      itemNombre = item.nombre;
    }

    const finalPrecio = precioUnitario !== undefined ? precioUnitario : item.precio;
    const finalImpuesto = impuesto !== undefined ? impuesto : item.impuesto;
    const { total } = calcularTotales(cantidad, finalPrecio, finalImpuesto);

    const asignacion = await EmpresaServicio.create({
      empresaId,
      productoId: productoId || null,
      servicioId: servicioId || null,
      cantidad,
      precioUnitario: finalPrecio,
      impuesto: finalImpuesto,
      precioTotal: total,
      fechaEjecucion: fechaEjecucion || null,
      fechaEntrega: fechaEntrega || null,
      observaciones,
    }, { transaction });

    await asignacion.reload({ transaction, include: [{ model: Producto, as: 'producto' }, { model: Servicio, as: 'servicio' }, { model: Empresa, as: 'empresa' }] });

    const eventoData = buildCalendarioEvento(asignacion, itemNombre, asignacion.empresa?.nombre || '');
    if (eventoData) {
      await CalendarioEvento.create(eventoData, { transaction });
    }

    await transaction.commit();

    const destinatarios = await getDestinatariosAsignacion(asignacion);
    if (destinatarios.length) {
      await enviarConfirmacionAsignacion(asignacion, destinatarios);
    }

    return res.status(201).json({ message: 'Asignación creada', asignacion });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const update = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const asignacion = await EmpresaServicio.findByPk(req.params.id, {
      include: [{ model: Producto, as: 'producto' }, { model: Servicio, as: 'servicio' }],
    });
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    assertEmpresaInScope(asignacion.empresaId, req);

    const camposPermitidos = ['cantidad', 'precioUnitario', 'impuesto', 'fechaEjecucion', 'fechaEntrega', 'estado', 'observaciones'];
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) asignacion[campo] = req.body[campo];
    });

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
    await asignacion.reload({ include: [{ model: Producto, as: 'producto' }, { model: Servicio, as: 'servicio' }, { model: Empresa, as: 'empresa' }] });

    return res.json({ message: 'Asignación actualizada', asignacion });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const asignacion = await EmpresaServicio.findByPk(req.params.id);
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    assertEmpresaInScope(asignacion.empresaId, req);
    await asignacion.update({ estado: 'cancelado' });
    return res.json({ message: 'Asignación cancelada' });
  } catch (error) { return next(error); }
};
