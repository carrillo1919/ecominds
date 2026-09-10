import { body } from 'express-validator';

import {
  dateOptional,
  dateRequired,
  enumOptional,
  paramArchivoId,
  paramDocumentoId,
  paramId,
  uuidOptional,
} from '../../../../shared/http/validation/rules.js';

export { paramId, paramDocumentoId, paramArchivoId };

// --- Documentos ---
export const documentoCreateRules = [
  uuidOptional('empresaId'),
  body('empresaRequisitoId')
    .notEmpty()
    .withMessage('Debe seleccionar un documento asignado')
    .isUUID()
    .withMessage('empresaRequisitoId inválido'),
  dateRequired('fechaVencimiento', 'Fecha de vencimiento inválida'),
  uuidOptional('responsableId'),
];

export const documentoUpdateRules = [
  paramId(),
  dateOptional('fechaVencimiento', 'Fecha de vencimiento inválida'),
  uuidOptional('responsableId'),
  enumOptional('estado', ['vigente', 'vencido'], 'Estado inválido'),
];

export const documentoArchivoRules = [
  paramDocumentoId(),
  paramArchivoId(),
];
