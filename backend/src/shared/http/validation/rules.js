import { body, param, query } from 'express-validator';

/* ============================================================
 * Validadores comunes / reutilizables
 * ============================================================ */

// --- Params (UUID) ---
export const paramId = (field = 'id', msg = 'Identificador inválido') =>
  param(field).isUUID().withMessage(msg);

export const paramEmpresaId = () =>
  param('empresaId').isUUID().withMessage('Identificador de empresa inválido');

export const paramDocumentoId = () =>
  param('documentoId').isUUID().withMessage('Identificador de documento inválido');

export const paramArchivoId = () =>
  param('archivoId').isUUID().withMessage('Identificador de archivo inválido');

// --- Campos de texto obligatorios ---
export const requiredText = (field, msg) =>
  body(field).trim().notEmpty().withMessage(msg);

export const optionalText = (field, msg) =>
  body(field).optional().trim().notEmpty().withMessage(msg);

// --- Email ---
export const emailRequired = () =>
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail();

export const emailOptional = () =>
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Correo inválido');

// --- UUID en body ---
export const uuidRequired = (field, msg = `${field} inválido`) =>
  body(field).isUUID().withMessage(msg);

export const uuidOptional = (field, msg = `${field} inválido`) =>
  body(field).optional({ values: 'falsy' }).isUUID().withMessage(msg);

// --- Fechas ---
export const isoDateOptional = (field, msg = 'Fecha inválida') =>
  body(field).optional({ values: 'falsy' }).isISO8601().withMessage(msg);

export const isoDateRequired = (field, msg = 'Fecha inválida') =>
  body(field).isISO8601().withMessage(msg);

export const dateOptional = (field, msg = 'Fecha inválida') =>
  body(field).optional().isDate().withMessage(msg);

export const dateRequired = (field, msg = 'Fecha inválida') =>
  body(field).isDate().withMessage(msg);

// --- Enums ---
export const enumOptional = (field, values, msg = 'Valor inválido') =>
  body(field).optional().isIn(values).withMessage(msg);

export const enumRequired = (field, values, msg = 'Valor inválido') =>
  body(field).isIn(values).withMessage(msg);

// --- Números / decimales ---
export const decimalRequired = (field, msg = `${field} debe ser un número decimal`) =>
  body(field).isDecimal().withMessage(msg);

export const decimalOptional = (field, msg = `${field} debe ser un número decimal`) =>
  body(field).optional({ values: 'falsy' }).isDecimal().withMessage(msg);

export const floatRequired = (field, opts = {}, msg = `${field} debe ser un número`) =>
  body(field).isFloat(opts).withMessage(msg);

// --- Booleanos ---
export const booleanOptional = (field, msg = `${field} debe ser booleano`) =>
  body(field).optional().isBoolean().withMessage(msg);

// --- Arreglos ---
export const arrayRequired = (field, opts = {}, msg = `${field} debe ser un arreglo`) =>
  body(field).isArray(opts).withMessage(msg);

export const arrayOfUUID = (field, msg = `${field} contiene un valor inválido`) =>
  body(field).isUUID().withMessage(msg);

// --- Query params ---
export const queryIsoDateOptional = (field, msg = 'Fecha inválida') =>
  query(field).optional().isISO8601().withMessage(msg);

export const queryIntOptional = (field, opts = {}, msg = `${field} debe ser un entero`) =>
  query(field).optional().isInt(opts).withMessage(msg);

// --- Contraseña ---
export const passwordValidation = () =>
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe incluir al menos una letra mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe incluir al menos una letra minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe incluir al menos un número')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('La contraseña debe incluir al menos un carácter especial');

export const confirmPassword = () =>
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden');
