import { body, param, query } from 'express-validator';

import {
  arrayOfUUID,
  arrayRequired,
  booleanOptional,
  confirmPassword,
  emailRequired,
  enumRequired,
  optionalText,
  paramId,
  passwordValidation,
  requiredText,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

// --- Auth ---
export const authRegisterRules = [
  requiredText('nombre', 'El nombre es obligatorio'),
  requiredText('apellido', 'El apellido es obligatorio'),
  emailRequired(),
  passwordValidation(),
  confirmPassword(),
];

export const authLoginRules = [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

export const authVerifyEmailRules = [
  query('token').notEmpty().withMessage('Token no proporcionado'),
];

export const authForgotPasswordRules = [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
];

export const authResetPasswordRules = [
  body('token').notEmpty().withMessage('Token no proporcionado'),
  passwordValidation(),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
];

// --- Usuarios ---
export const userCreateRules = [
  requiredText('nombre', 'El nombre es obligatorio'),
  requiredText('apellido', 'El apellido es obligatorio'),
  body('email').isEmail().withMessage('Correo inválido'),
  passwordValidation(),
  enumRequired('rol', ['admin', 'auditor', 'responsable', 'lector'], 'Rol inválido'),
  body('empresaIds').optional().isArray().withMessage('empresaIds debe ser un arreglo'),
  body('empresaIds.*').optional().isUUID().withMessage('empresaId inválido'),
];

export const userUpdateRules = [
  paramId(),
  optionalText('nombre', 'El nombre es obligatorio'),
  optionalText('apellido', 'El apellido es obligatorio'),
  body('email').optional().isEmail().withMessage('Correo inválido'),
  booleanOptional('activo'),
];

export const userUpdateRolRules = [
  paramId(),
  enumRequired('rol', ['admin', 'auditor', 'responsable', 'lector'], 'Rol inválido'),
];

export const userSetEmpresasRules = [
  paramId(),
  arrayRequired('empresaIds'),
  arrayOfUUID('empresaIds.*'),
];

export const userRemoveEmpresaRules = [
  paramId(),
  param('empresaId').isUUID().withMessage('empresaId inválido'),
];
