import { EmpresaRequisito, Empresa, RequisitoLegal, EnteRegulador } from '../models/index.js';
import * as service from '../services/empresaRequisitoService.js';
import { assertEmpresaInScope } from '../utils/empresaScope.js';

const getByEmpresa = async (req, res, next) => {
  try {
    assertEmpresaInScope(req.params.empresaId, req);
    const asignaciones = await EmpresaRequisito.findAll({
      where: { empresaId: req.params.empresaId },
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
    assertEmpresaInScope(req.body.empresaId, req);
    const asignacion = await service.assign(req.body);
    return res.status(201).json({ message: 'Requisito asignado', asignacion });
  } catch (error) { return next(error); }
};

const bulkAssign = async (req, res, next) => {
  try {
    assertEmpresaInScope(req.body.empresaId, req);
    const asignaciones = await service.bulkAssign(req.body);
    return res.status(201).json({ message: 'Requisitos asignados', asignaciones });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const asignacion = await EmpresaRequisito.findByPk(req.params.id);
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    assertEmpresaInScope(asignacion.empresaId, req);

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
    const asignacion = await EmpresaRequisito.findByPk(req.params.id);
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    assertEmpresaInScope(asignacion.empresaId, req);
    await asignacion.destroy();
    return res.json({ message: 'Asignación eliminada' });
  } catch (error) { return next(error); }
};

export { getByEmpresa, assign, bulkAssign, update, remove };