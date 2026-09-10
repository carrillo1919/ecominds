import { body } from 'express-validator';

import {
  booleanOptional,
  paramId,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

// --- Configuración de notificaciones ---
export const notificacionConfigUpdateRules = [
  paramId(),
  body('rangosDias')
    .optional()
    .isArray({ min: 1 })
    .withMessage('rangosDias debe ser un arreglo con al menos un valor'),
  body('rangosDias.*')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Cada rango de días debe ser un entero entre 0 y 365'),
  body('horaEnvio')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage('horaEnvio inválida (formato HH:MM o HH:MM:SS)'),
  booleanOptional('activo'),
  body('plantillaAsunto')
    .optional({ values: 'null' })
    .isString()
    .withMessage('plantillaAsunto debe ser texto')
    .isLength({ max: 255 })
    .withMessage('plantillaAsunto no puede superar 255 caracteres'),
  body('plantillaCuerpo')
    .optional({ values: 'null' })
    .isString()
    .withMessage('plantillaCuerpo debe ser texto'),
];
