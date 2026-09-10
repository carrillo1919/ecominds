import {
  listarRequisitosLegales,
  obtenerRequisitoLegal,
  crearRequisitoLegal,
  actualizarRequisitoLegal,
  configurarRequisitoLegal,
  desactivarRequisitoLegal,
} from '../../application/requisitoLegalService.js';

const getAll = async (req, res, next) => {
  try {
    const requisitos = await listarRequisitosLegales(req);
    return res.json({ requisitos });
  } catch (error) { return next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const requisito = await obtenerRequisitoLegal(req.params.id);
    return res.json({ requisito });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const requisito = await crearRequisitoLegal(req);
    return res.status(201).json({ message: 'Requisito creado', requisito });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const requisito = await actualizarRequisitoLegal(req.params.id, req);
    return res.json({ message: 'Requisito actualizado', requisito });
  } catch (error) { return next(error); }
};

const patchConfig = async (req, res, next) => {
  try {
    const requisito = await configurarRequisitoLegal(req.params.id, req);
    return res.json({ message: 'Configuración actualizada', requisito });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    await desactivarRequisitoLegal(req.params.id);
    return res.json({ message: 'Requisito desactivado' });
  } catch (error) { return next(error); }
};

export { getAll, getOne, create, update, patchConfig, remove };