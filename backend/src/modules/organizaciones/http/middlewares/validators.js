import { body } from 'express-validator';

import {
  emailOptional,
  enumOptional,
  optionalText,
  paramId,
  requiredText,
  uuidOptional,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

// --- Empresas ---
export const empresaCreateRules = [
  requiredText('nombre', 'El nombre es obligatorio'),
  requiredText('rif', 'El RIF es obligatorio'),
  emailOptional(),
  uuidOptional('responsableId'),
];

export const empresaUpdateRules = [
  paramId(),
  optionalText('nombre', 'El nombre es obligatorio'),
  emailOptional(),
  uuidOptional('responsableId'),
];

// --- Empleados ---
export const empleadoCreateRules = [
  requiredText('nombre', 'El nombre es obligatorio'),
  requiredText('apellido', 'El apellido es obligatorio'),
  requiredText('cedula', 'La cédula es obligatoria'),
  body('email').isEmail().withMessage('Correo inválido'),
  uuidOptional('empresaId'),
];

export const empleadoUpdateRules = [
  paramId(),
  emailOptional(),
];

export const empleadoAsignarUsuarioRules = [
  paramId(),
  enumOptional('rolUsuario', ['admin', 'auditor', 'responsable', 'lector'], 'Rol inválido'),
];
