import { Op } from 'sequelize';
import db from '../models/index.js';

const { Producto } = db;

export const getAll = async (req, res, next) => {
  try {
    const { activo, search } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (search) {
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { nombre: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const productos = await Producto.findAll({
      where,
      order: [['nombre', 'ASC']],
    });
    return res.json({ productos });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    return res.json({ producto });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const producto = await Producto.create(req.body);
    return res.status(201).json({ message: 'Producto creado', producto });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    await producto.update(req.body);
    return res.json({ message: 'Producto actualizado', producto });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    await producto.update({ activo: false });
    return res.json({ message: 'Producto desactivado' });
  } catch (error) { return next(error); }
};
