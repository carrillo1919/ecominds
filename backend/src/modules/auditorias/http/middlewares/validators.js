import { body } from 'express-validator';

import {
  arrayRequired,
  isoDateOptional,
  paramId,
  queryIntOptional,
  queryIsoDateOptional,
  uuidRequired,
} from '../../../../shared/http/validation/rules.js';

export { paramId };

// --- Auditorías ---
export const auditoriaEstadisticasRules = [
  queryIsoDateOptional('desde'),
  queryIsoDateOptional('hasta'),
];

export const auditoriaProximasRules = [
  queryIntOptional('dias', { min: 1, max: 365 }),
];

export const auditoriaCreateRules = [
  uuidRequired('empresaId', 'Debe seleccionar una empresa'),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida'),
  isoDateOptional('fechaProximaAuditoria'),
];

export const auditoriaUpdateRules = [
  paramId(),
  body('fecha').optional().isISO8601().withMessage('Fecha inválida'),
  isoDateOptional('fechaProximaAuditoria'),
];

export const auditoriaSaveItemsRules = [
  paramId(),
  arrayRequired('items', {}, 'Debe enviar los items evaluados'),
  body('items.*.id').isUUID().withMessage('Item inválido'),
  body('items.*.estado')
    .optional({ values: 'null' })
    .isIn(['cumple', 'no_cumple', 'na'])
    .withMessage('Estado inválido'),
];
