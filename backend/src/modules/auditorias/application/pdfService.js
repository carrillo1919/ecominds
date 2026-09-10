import { construirInformeAuditoria } from '../infrastructure/pdf/informe-auditoria.js';

/**
 * Servicio de generación de PDFs.
 * Delega la construcción de cada formato a su plantilla en infrastructure/pdf/.
 */
const construirInforme = (auditoria, resumen) => construirInformeAuditoria(auditoria, resumen);

export { construirInforme };