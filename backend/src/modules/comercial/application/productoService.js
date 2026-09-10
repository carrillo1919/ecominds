import { Op } from 'sequelize';
import { Producto } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['codigo', 'nombre', 'descripcion', 'precio', 'impuesto', 'activo'];

const buscarProducto = async (id) => {
  const producto = await Producto.findByPk(id);
  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado');
  }
  return producto;
};

export const listarProductos = async (req) => {
  const { activo, search } = req.query;
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true';
  if (search) {
    where[Op.or] = [
      { codigo: { [Op.iLike]: `%${search}%` } },
      { nombre: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Producto.findAll({ where, order: [['nombre', 'ASC']] });
};

export const obtenerProducto = async (id) => buscarProducto(id);

export const crearProducto = async (req) => Producto.create(req.body);

export const actualizarProducto = async (id, req) => {
  const producto = await buscarProducto(id);

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) producto[campo] = req.body[campo];
  });
  await producto.save();

  return producto;
};

export const desactivarProducto = async (id) => {
  const producto = await buscarProducto(id);

  producto.activo = false;
  await producto.save();
};