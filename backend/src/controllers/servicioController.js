import { Op } from 'sequelize';
import db from '../models/index.js';

const { Servicio } = db;

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

    const servicios = await Servicio.findAll({
      where,
      order: [['nombre', 'ASC']],
    });
    return res.json({ servicios });
  } catch (error) { return next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
    return res.json({ servicio });
  } catch (error) { return next(error); }
};

export const create = async (req, res, next) => {
  try {
    const servicio = await Servicio.create(req.body);
    return res.status(201).json({ message: 'Servicio creado', servicio });
  } catch (error) { return next(error); }
};

export const update = async (req, res, next) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
    await servicio.update(req.body);
    return res.json({ message: 'Servicio actualizado', servicio });
  } catch (error) { return next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
    await servicio.update({ activo: false });
    return res.json({ message: 'Servicio desactivado' });
  } catch (error) { return next(error); }
};
