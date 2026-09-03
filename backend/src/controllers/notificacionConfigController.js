import { NotificacionConfig } from '../models/index.js';

export const getConfig = async (req, res, next) => {
  try {
    const config = await NotificacionConfig.findAll();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rangosDias, horaEnvio, activo, plantillaAsunto, plantillaCuerpo } = req.body;
    const config = await NotificacionConfig.findByPk(id);
    if (!config) return res.status(404).json({ message: 'Configuración no encontrada' });

    await config.update({ rangosDias, horaEnvio, activo, plantillaAsunto, plantillaCuerpo });
    res.json(config);
  } catch (error) {
    next(error);
  }
};