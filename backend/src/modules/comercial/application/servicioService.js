import { Op } from 'sequelize';
import { Servicio } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['codigo', 'nombre', 'descripcion', 'precio', 'impuesto', 'activo'];

const buscarServicio = async (id) => {
  const servicio = await Servicio.findByPk(id);
  if (!servicio) {
    throw new HttpError(404, 'Servicio no encontrado');
  }
  return servicio;
};

export const listarServicios = async (req) => {
  const { activo, search } = req.query;
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true';
  if (search) {
    where[Op.or] = [
      { codigo: { [Op.iLike]: `%${search}%` } },
      { nombre: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Servicio.findAll({ where, order: [['nombre', 'ASC']] });
};

export const obtenerServicio = async (id) => buscarServicio(id);

export const crearServicio = async (req) => Servicio.create(req.body);

export const actualizarServicio = async (id, req) => {
  const servicio = await buscarServicio(id);

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) servicio[campo] = req.body[campo];
  });
  await servicio.save();

  return servicio;
};

export const desactivarServicio = async (id) => {
  const servicio = await buscarServicio(id);

  servicio.activo = false;
  await servicio.save();
};