import { RequisitoLegal, EnteRegulador } from '../models/index.js';

const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.enteId) where.enteId = req.query.enteId;
    if (req.query.categoria) where.categoria = req.query.categoria;
    if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

    const requisitos = await RequisitoLegal.findAll({
      where,
      order: [['categoria', 'ASC'], ['codigo', 'ASC']],
      include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }],
    });
    return res.json({ requisitos });
  } catch (error) { return next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const requisito = await RequisitoLegal.findByPk(req.params.id, {
      include: [{ model: EnteRegulador, as: 'ente' }],
    });
    if (!requisito) return res.status(404).json({ message: 'Requisito no encontrado' });
    return res.json({ requisito });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const requisito = await RequisitoLegal.create(req.body);
    return res.status(201).json({ message: 'Requisito creado', requisito });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const requisito = await RequisitoLegal.findByPk(req.params.id);
    if (!requisito) return res.status(404).json({ message: 'Requisito no encontrado' });
    const campos = ['enteId', 'codigo', 'titulo', 'descripcion', 'normaRespaldo', 'categoria', 'periodicidad', 'criticidad', 'vigenciaDesde', 'vigenciaHasta', 'activo'];
    campos.forEach((c) => { if (req.body[c] !== undefined) requisito[c] = req.body[c]; });
    await requisito.save();
    return res.json({ message: 'Requisito actualizado', requisito });
  } catch (error) { return next(error); }
};

const patchConfig = async (req, res, next) => {
  try {
    const requisito = await RequisitoLegal.findByPk(req.params.id);
    if (!requisito) return res.status(404).json({ message: 'Requisito no encontrado' });
    ['criticidad', 'vigenciaDesde', 'vigenciaHasta', 'activo'].forEach((c) => {
      if (req.body[c] !== undefined) requisito[c] = req.body[c];
    });
    await requisito.save();
    return res.json({ message: 'Configuración actualizada', requisito });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    const requisito = await RequisitoLegal.findByPk(req.params.id);
    if (!requisito) return res.status(404).json({ message: 'Requisito no encontrado' });
    requisito.activo = false;
    await requisito.save();
    return res.json({ message: 'Requisito desactivado' });
  } catch (error) { return next(error); }
};

export { getAll, getOne, create, update, patchConfig, remove };