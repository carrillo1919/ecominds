import * as service from '../../application/empresaRequisitoService.js';
import { assertEmpresaInScope } from '../../../../shared/security/tenant-scope.js';

const getByEmpresa = async (req, res, next) => {
  try {
    const asignaciones = await service.listarPorEmpresa(req.params.empresaId, req);
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
    const asignacion = await service.actualizarAsignacion(req.params.id, req);
    return res.json({ message: 'Asignación actualizada', asignacion });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    await service.eliminarAsignacion(req.params.id, req);
    return res.json({ message: 'Asignación eliminada' });
  } catch (error) { return next(error); }
};

export { getByEmpresa, assign, bulkAssign, update, remove };