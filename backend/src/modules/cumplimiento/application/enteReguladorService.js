import { EnteRegulador, RequisitoLegal } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['nombre', 'sigla', 'ambito', 'contacto', 'sitioWeb', 'activo'];

export const listarEntes = async (req) => {
  const where = {};
  if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

  return EnteRegulador.findAll({ where, order: [['nombre', 'ASC']] });
};

export const obtenerEnte = async (id) => {
  const ente = await EnteRegulador.findByPk(id, {
    include: [{ model: RequisitoLegal, as: 'requisitos' }],
  });
  if (!ente) {
    throw new HttpError(404, 'Ente regulador no encontrado');
  }
  return ente;
};

export const crearEnte = async (req) => EnteRegulador.create(req.body);

export const actualizarEnte = async (id, req) => {
  const ente = await EnteRegulador.findByPk(id);
  if (!ente) {
    throw new HttpError(404, 'Ente regulador no encontrado');
  }

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) ente[campo] = req.body[campo];
  });
  await ente.save();

  return ente;
};

export const desactivarEnte = async (id) => {
  const ente = await EnteRegulador.findByPk(id);
  if (!ente) {
    throw new HttpError(404, 'Ente regulador no encontrado');
  }

  ente.activo = false;
  await ente.save();
};