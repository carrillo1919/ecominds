import { EmpresaRequisito, Empresa, RequisitoLegal, EnteRegulador } from '../models/index.js';
import * as service from '../services/empresaRequisitoService.js';

const getByEmpresa = async (req, res, next) => {
  try {
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
    const asignacion = await service.assign(req.body);
    return res.status(201).json({ message: 'Requisito asignado', asignacion });
  } catch (error) { return next(error); }
};

const bulkAssign = async (req, res, next) => {
  try {
    const asignaciones = await service.bulkAssign(req.body);
    return res.status(201).json({ message: 'Requisitos asignados', asignaciones });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const asignacion = await EmpresaRequisito.findByPk(req.params.id);
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
    const asignacion = await EmpresaRequisito.findByPk(req.params.id);
    if (!asignacion) return res.status(404).json({ message: 'Asignación no encontrada' });
    await asignacion.destroy();
    return res.json({ message: 'Asignación eliminada' });
  } catch (error) { return next(error); }
};

export { getByEmpresa, assign, bulkAssign, update, remove };