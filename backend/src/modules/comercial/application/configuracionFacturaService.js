import { Op } from 'sequelize';
import { ConfiguracionFactura } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['tipo', 'nombre', 'porcentaje', 'descripcion', 'activo'];

const buscarConfiguracion = async (id) => {
  const configuracion = await ConfiguracionFactura.findByPk(id);
  if (!configuracion) {
    throw new HttpError(404, 'Configuración no encontrada');
  }
  return configuracion;
};

export const listarConfiguraciones = async (req) => {
  const { tipo, activo, search } = req.query;
  const where = {};
  if (tipo) where.tipo = tipo;
  if (activo !== undefined) where.activo = activo === 'true';
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };

  return ConfiguracionFactura.findAll({
    where,
    order: [['nombre', 'ASC']],
  });
};

export const obtenerConfiguracion = async (id) => buscarConfiguracion(id);

export const crearConfiguracion = async (req) => ConfiguracionFactura.create({
  tipo: req.body.tipo,
  nombre: req.body.nombre,
  porcentaje: req.body.porcentaje,
  descripcion: req.body.descripcion || null,
  activo: req.body.activo === undefined ? true : req.body.activo,
});

export const actualizarConfiguracion = async (id, req) => {
  const configuracion = await buscarConfiguracion(id);

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) configuracion[campo] = req.body[campo];
  });
  await configuracion.save();

  return configuracion;
};

export const desactivarConfiguracion = async (id) => {
  const configuracion = await buscarConfiguracion(id);

  configuracion.activo = false;
  await configuracion.save();
};
