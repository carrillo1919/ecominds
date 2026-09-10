import {
  listarEntes,
  obtenerEnte,
  crearEnte,
  actualizarEnte,
  desactivarEnte,
} from '../../application/enteReguladorService.js';

const getAll = async (req, res, next) => {
  try {
    const entes = await listarEntes(req);
    return res.json({ entes });
  } catch (error) { return next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const ente = await obtenerEnte(req.params.id);
    return res.json({ ente });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const ente = await crearEnte(req);
    return res.status(201).json({ message: 'Ente regulador creado', ente });
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  try {
    const ente = await actualizarEnte(req.params.id, req);
    return res.json({ message: 'Ente regulador actualizado', ente });
  } catch (error) { return next(error); }
};

const remove = async (req, res, next) => {
  try {
    await desactivarEnte(req.params.id);
    return res.json({ message: 'Ente regulador desactivado' });
  } catch (error) { return next(error); }
};

export { getAll, getOne, create, update, remove };