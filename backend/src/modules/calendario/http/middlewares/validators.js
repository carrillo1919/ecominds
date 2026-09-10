import { body, query } from 'express-validator';

import {
  enumOptional,
  optionalText,
  paramId,
  requiredText,
  uuidOptional,
  uuidRequired,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

const fechaISO = (field, msg = 'Fecha inválida (formato YYYY-MM-DD)') =>
  body(field).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(msg);

export const calendarioEventoCreateRules = [
  requiredText('titulo', 'El título es obligatorio'),
  fechaISO('fecha'),
  enumOptional('tipo', ['auditoria', 'nota', 'compromiso'], 'Tipo inválido'),
  enumOptional('privacidad', ['publico', 'privado'], 'Privacidad inválida'),
  uuidOptional('auditoriaId'),
  uuidOptional('empresaId'),
];

export const calendarioEventoUpdateRules = [
  paramId(),
  optionalText('titulo', 'El título es obligatorio'),
  fechaISO('fecha'),
  enumOptional('tipo', ['auditoria', 'nota', 'compromiso'], 'Tipo inválido'),
  enumOptional('privacidad', ['publico', 'privado'], 'Privacidad inválida'),
  uuidOptional('empresaId'),
];

export const calendarioAuditoriaCreateRules = [
  fechaISO('fecha'),
  uuidRequired('empresaId', 'empresaId es obligatorio para crear una auditoría'),
  optionalText('titulo', 'El título es obligatorio'),
];

export const calendarioEventosQueryRules = [
  query('fechaInicio').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('fechaInicio inválida (YYYY-MM-DD)'),
  query('fechaFin').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('fechaFin inválida (YYYY-MM-DD)'),
  query('fechaInicio')
    .custom((value, { req }) => (!value && !req.query.fechaFin) || (value && req.query.fechaFin))
    .withMessage('fechaInicio y fechaFin son obligatorias en conjunto'),
];
