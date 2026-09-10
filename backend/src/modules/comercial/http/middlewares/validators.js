import { body } from 'express-validator';

import {
  arrayRequired,
  booleanOptional,
  dateOptional,
  decimalOptional,
  decimalRequired,
  enumOptional,
  enumRequired,
  paramId,
  requiredText,
  uuidOptional,
  uuidRequired,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

// --- Productos ---
export const productoCreateRules = [
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('nombre', 'El nombre es obligatorio'),
  decimalRequired('precio'),
  body('impuesto').optional().isDecimal(),
  booleanOptional('activo'),
];

// --- Servicios ---
export const servicioCreateRules = [
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('nombre', 'El nombre es obligatorio'),
  decimalRequired('precio'),
  body('impuesto').optional().isDecimal(),
  booleanOptional('activo'),
];

// --- Empresa-Servicio ---
export const empresaServicioCreateRules = [
  uuidRequired('empresaId'),
  uuidOptional('productoId'),
  uuidOptional('servicioId'),
  decimalRequired('cantidad'),
  decimalOptional('precioUnitario'),
  decimalOptional('impuesto'),
  body('productoId')
    .custom((value, { req }) => Boolean(value) || Boolean(req.body.servicioId))
    .withMessage('Debe indicar productoId o servicioId'),
  body('servicioId')
    .custom((value, { req }) => !(value && req.body.productoId))
    .withMessage('Solo puede indicar productoId o servicioId, no ambos'),
];

export const empresaServicioUpdateRules = [
  paramId(),
  decimalOptional('cantidad'),
  decimalOptional('precioUnitario'),
  decimalOptional('impuesto'),
  enumOptional('estado', ['pendiente', 'facturado', 'cancelado'], 'Estado inválido'),
  dateOptional('fechaEntrega', 'Fecha de entrega inválida'),
  dateOptional('fechaEjecucion', 'Fecha de ejecución inválida'),
];

// --- Facturas ---
export const facturaCreateRules = [
  uuidRequired('empresaId'),
  arrayRequired('asignacionIds', { min: 1 }),
  body('asignacionIds.*').isUUID().withMessage('asignacionId inválido'),
  dateOptional('fechaVencimiento', 'Fecha de vencimiento inválida'),
];

export const facturaUpdateRules = [
  paramId(),
  dateOptional('fechaVencimiento', 'Fecha de vencimiento inválida'),
];

export const facturaCambiarEstadoRules = [
  paramId(),
  enumRequired('estado', ['borrador', 'emitida', 'pagada', 'anulada']),
  body('fechaPago').if(body('estado').equals('pagada')).isISO8601(),
  body('metodoPago')
    .if(body('estado').equals('pagada'))
    .isIn(['transferencia', 'pago_movil', 'efectivo', 'usd']),
  body('montoPago').if(body('estado').equals('pagada')).isFloat({ gt: 0 }),
  body('referenciaPago')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 100 }),
  body('bancoPago')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 150 }),
  body('telefonoPago')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ max: 30 }),
];
