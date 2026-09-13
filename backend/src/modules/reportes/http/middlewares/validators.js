import { query } from 'express-validator';
import {
  queryIsoDateOptional,
  queryIntOptional,
} from '../../../../shared/http/validation/rules.js';

const estadosFactura = ['borrador', 'emitida', 'pagada', 'anulada'];
const tipos = ['todos', 'producto', 'servicio'];
const sortBy = ['numero', 'empresa', 'fechaEmision', 'fechaPago', 'estado', 'total', 'deuda', 'tipoItems', 'cantidadItems'];
const sortDir = ['asc', 'desc'];

export const dashboardReportesRules = [
  query('empresaId').optional().isUUID().withMessage('empresaId inválido'),
  queryIsoDateOptional('desde'),
  queryIsoDateOptional('hasta'),
  query('estados')
    .optional()
    .custom((value) => String(value).split(',').every((x) => estadosFactura.includes(x.trim())))
    .withMessage('Estado inválido'),
  query('tipo').optional().isIn(tipos).withMessage('Tipo inválido'),
  query('search').optional().isString().isLength({ max: 100 }),
  queryIntOptional('page', { min: 1, max: 100000 }),
  queryIntOptional('limit', { min: 1, max: 100 }),
  query('sortBy').optional().isIn(sortBy),
  query('sortDir').optional().isIn(sortDir),
  query('columns').optional().isString().isLength({ max: 300 }),
];
