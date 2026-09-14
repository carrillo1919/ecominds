import {
  listarConfiguraciones,
  obtenerConfiguracion,
  crearConfiguracion,
  actualizarConfiguracion,
  desactivarConfiguracion,
} from '../../application/configuracionFacturaService.js';

export const getAll = async (req, res, next) => {
  try {
    const configuraciones = await listarConfiguraciones(req);
    return res.json({ configuraciones });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const configuracion = await obtenerConfiguracion(req.params.id);
    return res.json({ configuracion });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const configuracion = await crearConfiguracion(req);
    return res.status(201).json({ message: 'Configuración creada', configuracion });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const configuracion = await actualizarConfiguracion(req.params.id, req);
    return res.json({ message: 'Configuración actualizada', configuracion });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await desactivarConfiguracion(req.params.id);
    return res.json({ message: 'Configuración desactivada' });
  } catch (error) { return next(error); }
};
