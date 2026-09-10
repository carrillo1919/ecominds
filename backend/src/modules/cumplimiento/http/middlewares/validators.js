import { body } from 'express-validator';

import {
  arrayRequired,
  booleanOptional,
  enumOptional,
  optionalText,
  paramEmpresaId,
  paramId,
  requiredText,
  uuidRequired,
} from '../../../../shared/http/validation/rules.js';

export { paramId, paramEmpresaId };

// --- Entes reguladores ---
export const enteReguladorCreateRules = [
  requiredText('nombre', 'El nombre es obligatorio'),
  requiredText('sigla', 'La sigla es obligatoria'),
  enumOptional('ambito', ['nacional', 'departamental', 'municipal', 'sectorial']),
  body('sitioWeb')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('URL inválida'),
];

export const enteReguladorUpdateRules = [
  paramId(),
  optionalText('nombre', 'El nombre es obligatorio'),
  enumOptional('ambito', ['nacional', 'departamental', 'municipal', 'sectorial']),
];

// --- Requisitos legales ---
export const requisitoLegalCreateRules = [
  uuidRequired('enteId', 'Ente regulador inválido'),
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('titulo', 'El título es obligatorio'),
  requiredText('categoria', 'La categoría es obligatoria'),
  enumOptional('periodicidad', ['unica', 'mensual', 'trimestral', 'semestral', 'anual']),
  enumOptional('criticidad', ['alta', 'media', 'baja']),
];

export const requisitoLegalPatchRules = [
  paramId(),
  enumOptional('criticidad', ['alta', 'media', 'baja']),
  body('vigenciaDesde').optional().isISO8601(),
  body('vigenciaHasta').optional().isISO8601(),
];

// --- Requisitos (genéricos) ---
export const checklistUpdateRules = [
  paramId(),
  booleanOptional('critico'),
  booleanOptional('activo'),
];

const checklistFieldsRules = [
  requiredText('bloque', 'El bloque es obligatorio'),
  requiredText('codigo', 'El código es obligatorio'),
  requiredText('requisito', 'El requisito es obligatorio'),
  optionalText('enteRegulador', 'El ente regulador no puede estar vacío'),
  optionalText('baseLegal', 'La base legal no puede estar vacía'),
  booleanOptional('critico'),
  booleanOptional('activo'),
  body('orden')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un entero positivo')
    .toInt(),
];

export const checklistCreateRules = checklistFieldsRules;

export const checklistEditRules = [
  paramId(),
  ...checklistFieldsRules,
];

// --- Empresa-Requisito ---
export const empresaRequisitoAssignRules = [
  uuidRequired('empresaId'),
  uuidRequired('requisitoId'),
];

export const empresaRequisitoBulkRules = [
  uuidRequired('empresaId'),
  arrayRequired('requisitoIds', { min: 1 }),
];
