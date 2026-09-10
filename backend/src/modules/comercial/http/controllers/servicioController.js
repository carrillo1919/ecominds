import {
  listarServicios,
  obtenerServicio,
  crearServicio,
  actualizarServicio,
  desactivarServicio,
} from '../../application/servicioService.js';

export const getAll = async (req, res, next) => {
  try {
    const servicios = await listarServicios(req);
    return res.json({ servicios });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const servicio = await obtenerServicio(req.params.id);
    return res.json({ servicio });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const servicio = await crearServicio(req);
    return res.status(201).json({ message: 'Servicio creado', servicio });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const servicio = await actualizarServicio(req.params.id, req);
    return res.json({ message: 'Servicio actualizado', servicio });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await desactivarServicio(req.params.id);
    return res.json({ message: 'Servicio desactivado' });
  } catch (error) { return next(error); }
};
