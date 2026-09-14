import { query } from 'express-validator';
import {
  queryIsoDateOptional,
  queryIntOptional,
} from '../../../../shared/http/validation/rules.js';
import { scopeRequiereEmpresaId } from '../../../../shared/security/tenant-scope.js';

const estadosFactura = ['borrador', 'emitida', 'pagada', 'anulada'];
const tipos = ['todos', 'producto', 'servicio'];
const sortBy = [
  'numero', 'empresa', 'fechaEmision', 'fechaPago', 'estado', 'subtotal', 'total', 'deuda', 'tipoItems', 'cantidadItems', 'cantidadTotal',
];
const sortDir = ['asc', 'desc'];

export const dashboardReportesRules = [
  query('empresaId').optional({ values: 'falsy' }).isUUID().withMessage('empresaId inválido'),
  // Los filtros de fecha son opcionales; empresaId solo es obligatorio para
  // usuarios no admin con empresas asignadas (auditor) o empleado (responsable).
  query('empresaId')
    .custom((value, { req }) => !scopeRequiereEmpresaId(req) || Boolean(value))
    .withMessage('Debe seleccionar una empresa'),
  queryIsoDateOptional('desde'),
  queryIsoDateOptional('hasta'),
  query('estados')
    .optional({ values: 'falsy' })
    .custom((value) => String(value).split(',').every((x) => estadosFactura.includes(x.trim())))
    .withMessage('Estado inválido'),
  query('tipo').optional({ values: 'falsy' }).isIn(tipos).withMessage('Tipo inválido'),
  query('search').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  queryIntOptional('page', { min: 1, max: 100000 }),
  queryIntOptional('limit', { min: 1, max: 100 }),
  query('sortBy').optional({ values: 'falsy' }).isIn(sortBy),
  query('sortDir').optional({ values: 'falsy' }).isIn(sortDir),
  query('columns').optional({ values: 'falsy' }).isString().isLength({ max: 300 }),
];
