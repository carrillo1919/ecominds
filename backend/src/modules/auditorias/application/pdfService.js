import { construirInformeAuditoria } from '../infrastructure/pdf/informe-auditoria.js';
import { construirFormatoCampoAuditoria } from '../infrastructure/pdf/formato-campo-auditoria.js';

/**
 * Servicio de generación de PDFs.
 * Delega la construcción de cada formato a su plantilla en infrastructure/pdf/.
 */
const construirInforme = (auditoria, resumen) => construirInformeAuditoria(auditoria, resumen);
const construirFormatoCampo = (auditoria) => construirFormatoCampoAuditoria(auditoria);

export { construirInforme, construirFormatoCampo };