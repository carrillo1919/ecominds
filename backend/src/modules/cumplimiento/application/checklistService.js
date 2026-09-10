import { Requisito } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const CAMPOS_ACTUALIZABLES = ['critico', 'activo', 'enteRegulador', 'baseLegal', 'requisito'];
const CAMPOS_EDITABLES = ['bloque', 'codigo', 'requisito', 'enteRegulador', 'baseLegal', 'critico', 'orden', 'activo'];

export const listarChecklist = async (req) => {
  const where = {};
  if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

  return Requisito.findAll({ where, order: [['orden', 'ASC'], ['codigo', 'ASC']] });
};

export const actualizarItemChecklist = async (id, req) => {
  const requisito = await Requisito.findByPk(id);
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }

  CAMPOS_ACTUALIZABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) requisito[campo] = req.body[campo];
  });
  await requisito.save();

  return requisito;
};

export const crearItemChecklist = async (req) => {
  const existente = await Requisito.findOne({ where: { codigo: req.body.codigo } });
  if (existente) {
    throw new HttpError(409, 'Ya existe un requisito con ese código');
  }

  return Requisito.create({
    bloque: req.body.bloque,
    codigo: req.body.codigo,
    requisito: req.body.requisito,
    enteRegulador: req.body.enteRegulador || null,
    baseLegal: req.body.baseLegal || null,
    critico: req.body.critico ?? false,
    orden: req.body.orden ?? 0,
    activo: req.body.activo ?? true,
  });
};

export const editarItemChecklist = async (id, req) => {
  const requisito = await Requisito.findByPk(id);
  if (!requisito) {
    throw new HttpError(404, 'Requisito no encontrado');
  }

  if (requisito.codigo !== req.body.codigo) {
    const existente = await Requisito.findOne({ where: { codigo: req.body.codigo } });
    if (existente) {
      throw new HttpError(409, 'Ya existe un requisito con ese código');
    }
  }

  CAMPOS_EDITABLES.forEach((campo) => {
    if (req.body[campo] !== undefined) requisito[campo] = req.body[campo];
  });
  await requisito.save();

  return requisito;
};