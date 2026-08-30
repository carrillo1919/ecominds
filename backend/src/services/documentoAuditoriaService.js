import { DocumentoAuditoriaLog } from '../models/index.js';

/**
 * Registra una acción de auditoría sobre un documento.
 * @param {object} params
 * @param {string|null} params.documentoId
 * @param {string|null} params.empleadoId
 * @param {string}      params.empresaId
 * @param {'creado'|'editado'|'eliminado'} params.accion
 * @param {object}      [params.detalle]
 */
const registrarAccion = async ({ documentoId, empleadoId, empresaId, accion, detalle = null }) => {
  await DocumentoAuditoriaLog.create({
    documentoId,
    empleadoId,
    empresaId,
    accion,
    detalle,
  });
};

export { registrarAccion };
