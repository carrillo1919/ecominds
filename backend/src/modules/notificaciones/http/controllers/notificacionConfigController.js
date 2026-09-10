import {
  listarConfiguraciones,
  actualizarConfiguracion,
} from '../../application/notificacionConfigService.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = await listarConfiguraciones();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const config = await actualizarConfiguracion(req.params.id, req);
    res.json(config);
  } catch (error) {
    next(error);
  }
};