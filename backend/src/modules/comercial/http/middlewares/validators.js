import { body } from 'express-validator';

import {
  arrayRequired,
  booleanOptional,
  dateOptional,
  decimalOptional,
  decimalRequired,
  enumOptional,
  enumRequired,
  floatRequired,
  paramId,
  requiredText,
  uuidOptional,
  uuidRequired,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

const unidadMedidaRule = (field = 'unidadMedida') =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('La unidad de medida no puede superar los 20 caracteres');

const arregloOpcionalUUID = (field) => [
  body(field)
    .optional({ values: 'falsy' })
    .isArray()
    .withMessage(`${field} debe ser un arreglo`),
  body(`${field}.*`).isUUID().withMessage(`${field} contiene un valor inválido`),
];

// --- Productos ---
export const productoCreateRules = [
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('nombre', 'El nombre es obligatorio'),
  decimalRequired('precio'),
  unidadMedidaRule(),
  booleanOptional('activo'),
];

// --- Servicios ---
export const servicioCreateRules = [
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('nombre', 'El nombre es obligatorio'),
  decimalRequired('precio'),
  unidadMedidaRule(),
  booleanOptional('activo'),
];

// --- Empresa-Servicio ---
export const empresaServicioCreateRules = [
  uuidRequired('empresaId'),
  uuidOptional('productoId'),
  uuidOptional('servicioId'),
  decimalRequired('cantidad'),
  decimalOptional('precioUnitario'),
  unidadMedidaRule(),
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
  unidadMedidaRule(),
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
  ...arregloOpcionalUUID('impuestoIds'),
  ...arregloOpcionalUUID('descuentoIds'),
  body('notas')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Las notas deben ser texto')
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden superar los 2000 caracteres'),
];

// --- Configuración de factura (impuestos y descuentos) ---
export const configuracionFacturaCreateRules = [
  enumRequired('tipo', ['impuesto', 'descuento'], 'El tipo debe ser impuesto o descuento'),
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 150 })
    .withMessage('El nombre no puede superar los 150 caracteres'),
  floatRequired('porcentaje', { min: 0, max: 100 }, 'El porcentaje debe estar entre 0 y 100'),
  body('descripcion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede superar los 255 caracteres'),
  booleanOptional('activo'),
];

export const configuracionFacturaUpdateRules = [
  paramId(),
  enumOptional('tipo', ['impuesto', 'descuento'], 'El tipo debe ser impuesto o descuento'),
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 150 })
    .withMessage('El nombre no puede superar los 150 caracteres'),
  body('porcentaje')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100'),
  body('descripcion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('La descripción no puede superar los 255 caracteres'),
  booleanOptional('activo'),
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
