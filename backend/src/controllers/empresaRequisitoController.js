import { EmpresaRequisito, Empresa, RequisitoLegal, EnteRegulador } from '../models/index.js';
import * as service from '../services/empresaRequisitoService.js';
import { resolveEmpresaWhere, puedeAccederEmpresa } from '../utils/authorization.js';

const getByEmpresa = async (req, res, next) => {
  try {
    const empresaId = req.params.empresaId;
    if (!puedeAccederEmpresa(req, empresaId)) {
      return res.status(403).json({ message: 'No tiene permisos para acceder a esta empresa' });
    }
    const asignaciones = await EmpresaRequisito.findAll({
      where: { empresaId },
      include: [
        { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ asignaciones });
  } catch (error) { return next(error); }
};

const assign = async (req, res, next) => {
  try {
    if (!puedeAccederEmpresa(req, req.body.empresaId)) {
      return res.status(403).json({ message: 'No tiene permisos para asignar requisitos a esta empresa' });
    }
    const asignacion = await service.assign(req.body);
    return res.status(201).json({ message: 'Requisito asignado', asignacion });
  } catch (error) { return next(error); }
};

const bulkAssign = async (req, res, next) => {
  try {
    if (!puedeAccederEmpresa(req, req.body.empresaId)) {
      return res.status(403).json({ message: 'No tiene permisos para asignar requisitos a esta empresa' });
    }
    const asignaciones = await service.bulkAssign(req.body);
    return res.status(201).json({ message: 'Requisitos asignados', asignaciones });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveEmpresaWhere(req, { empresaIdField: 'empresaId' }) };
    const asignacion = await EmpresaRequisito.findOne({ where });
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });

    if (req.body.observaciones !== undefined) asignacion.observaciones = req.body.observaciones;
    await asignacion.save();

    const result = await EmpresaRequisito.findByPk(asignacion.id, {
      include: [
        { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }] },
      ],
    });
    return res.json({ message: 'Asignación actualizada', asignacion: result });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveEmpresaWhere(req, { empresaIdField: 'empresaId' }) };
    const asignacion = await EmpresaRequisito.findOne({ where });
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    await asignacion.destroy();
    return res.json({ message: 'Asignación eliminada' });
  } catch (error) { return next(error); }
};

export { getByEmpresa, assign, bulkAssign, update, remove };
