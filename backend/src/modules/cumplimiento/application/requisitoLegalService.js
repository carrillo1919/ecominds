import { RequisitoLegal, EnteRegulador } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const INCLUDE_ENTE = { model: EnteRegulador, as: 'ente' };

const CAMPOS_ACTUALIZABLES = [
  'enteId',
  'codigo',
  'titulo',
  'descripcion',
  'normaRespaldo',
  'categoria',
  'periodicidad',
  'criticidad',
  'vigenciaDesde',
  'vigenciaHasta',
  'activo',
];

const CAMPOS_CONFIGURABLES = ['criticidad', 'vigenciaDesde', 'vigenciaHasta', 'activo'];

const buscarRequisito = async (id) => {
  const requisito = await RequisitoLegal.findByPk(id);
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }
  return requisito;
};

export const listarRequisitosLegales = async (req) => {
  const where = {};
  if (req.query.enteId) where.enteId = req.query.enteId;
  if (req.query.categoria) where.categoria = req.query.categoria;
  if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

  return RequisitoLegal.findAll({
    where,
    order: [['categoria', 'ASC'], ['codigo', 'ASC']],
    include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }],
  });
};

export const obtenerRequisitoLegal = async (id) => {
  const requisito = await RequisitoLegal.findByPk(id, { include: [INCLUDE_ENTE] });
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }
  return requisito;
};

export const crearRequisitoLegal = async (req) => RequisitoLegal.create(req.body);

export const actualizarRequisitoLegal = async (id, req) => {
  const requisito = await buscarRequisito(id);

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) requisito[campo] = req.body[campo];
  });
  await requisito.save();

  return requisito;
};

export const configurarRequisitoLegal = async (id, req) => {
  const requisito = await buscarRequisito(id);

  CAMPOS_CONFIGURABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) requisito[campo] = req.body[campo];
  });
  await requisito.save();

  return requisito;
};

export const desactivarRequisitoLegal = async (id) => {
  const requisito = await buscarRequisito(id);

  requisito.activo = false;
  await requisito.save();
};