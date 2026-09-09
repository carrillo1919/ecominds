import db from '../models/index.js';
import { assertEmpresaInScope } from '../utils/empresaScope.js';
import { generarFacturaDesdeAsignaciones, cambiarEstadoFactura } from '../services/facturacionService.js';

const { Factura, FacturaItem, EmpresaServicio, Producto, Servicio, Empresa } = db;

export const getAll = async (req, res, next) => {
  try {
    const { empresaId, estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (empresaId) {
      assertEmpresaInScope(empresaId, req);
      where.empresaId = empresaId;
    }

    const facturas = await Factura.findAll({
      where,
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ facturas });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id, {
      include: [
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
      ],
    });
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);
    return res.json({ factura });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const { empresaId, asignacionIds, fechaVencimiento, notas } = req.body;
    if (!empresaId || !Array.isArray(asignacionIds) || !asignacionIds.length) {
      return res.status(400).json({ message: 'empresaId y asignacionIds son obligatorios' });
    }
    assertEmpresaInScope(empresaId, req);

    const factura = await generarFacturaDesdeAsignaciones({
      empresaId,
      asignacionIds,
      fechaVencimiento,
      notas,
    });
    return res.status(201).json({ message: 'Factura generada', factura });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    const camposPermitidos = ['fechaVencimiento', 'notas'];
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) factura[campo] = req.body[campo];
    });
    await factura.save();
    return res.json({ message: 'Factura actualizada', factura });
  } catch (error) { return next(error); }
};

export const cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    await cambiarEstadoFactura(factura.id, estado);
    return res.json({ message: 'Estado actualizado', factura });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Factura no encontrada' });
    assertEmpresaInScope(factura.empresaId, req);

    await cambiarEstadoFactura(factura.id, 'anulada');
    return res.json({ message: 'Factura anulada' });
  } catch (error) { return next(error); }
};
