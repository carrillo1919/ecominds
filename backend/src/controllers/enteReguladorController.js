import { EnteRegulador, RequisitoLegal } from '../models/index.js';

const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';
    const entes = await EnteRegulador.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json({ entes });
  } catch (error) { return next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const ente = await EnteRegulador.findByPk(req.params.id, {
      include: [{ model: RequisitoLegal, as: 'requisitos' }],
    });
    if (!ente) return res.status(404).json({ message: 'Ente regulador no encontrado' });
    return res.json({ ente });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const ente = await EnteRegulador.create(req.body);
    return res.status(201).json({ message: 'Ente regulador creado', ente });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const ente = await EnteRegulador.findByPk(req.params.id);
    if (!ente) return res.status(404).json({ message: 'Ente regulador no encontrado' });
    ['nombre', 'sigla', 'ambito', 'contacto', 'sitioWeb', 'activo'].forEach((c) => {
      if (req.body[c] !== undefined) ente[c] = req.body[c];
    });
    await ente.save();
    return res.json({ message: 'Ente regulador actualizado', ente });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    const ente = await EnteRegulador.findByPk(req.params.id);
    if (!ente) return res.status(404).json({ message: 'Ente regulador no encontrado' });
    ente.activo = false;
    await ente.save();
    return res.json({ message: 'Ente regulador desactivado' });
  } catch (error) { return next(error); }
};

export { getAll, getOne, create, update, remove };