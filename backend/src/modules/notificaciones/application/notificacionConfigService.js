import { NotificacionConfig } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['rangosDias', 'horaEnvio', 'activo', 'plantillaAsunto', 'plantillaCuerpo'];

export const listarConfiguraciones = async () => NotificacionConfig.findAll();

export const actualizarConfiguracion = async (id, req) => {
  const config = await NotificacionConfig.findByPk(id);
  if (!config) {
    throw new HttpError(404, 'Configuración no encontrada');
  }

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) config[campo] = req.body[campo];
  });
  await config.save();

  return config;
};