import {
  listarAsignaciones,
  crearAsignacion,
  actualizarAsignacion,
  cancelarAsignacion,
} from '../../application/empresaServicioService.js';

export const getAll = async (req, res, next) => {
  try {
    const asignaciones = await listarAsignaciones(req);
    return res.json({ asignaciones });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const asignacion = await crearAsignacion(req);
    return res.status(201).json({ message: 'Asignación creada', asignacion });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const asignacion = await actualizarAsignacion(req.params.id, req);
    return res.json({ message: 'Asignación actualizada', asignacion });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await cancelarAsignacion(req.params.id, req);
    return res.json({ message: 'Asignación cancelada' });
  } catch (error) { return next(error); }
};
