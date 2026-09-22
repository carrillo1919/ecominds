import { construirFormatoCampo, construirInforme } from '../../application/pdfService.js';
import { obtenerInformeAuditoria } from '../../application/reporteService.js';

const marcaFechaHora = () => {
  const fecha = new Date();
  return [
    String(fecha.getHours()).padStart(2, '0'),
    String(fecha.getMinutes()).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    fecha.getFullYear(),
  ].join('');
};

// GET /api/auditorias/:id/informe.pdf  (RF-06.1)
const informePdf = async (req, res, next) => {
  try {
    const resultado = await obtenerInformeAuditoria(req.params.id, req);
    if (!resultado) return res.status(404).json({ message: 'Auditoria no encontrada' });

    const { auditoria, resumen } = resultado;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-${auditoria.codigo || auditoria.id}-${marcaFechaHora()}.pdf"`
    );

    const doc = construirInforme(auditoria, resumen);
    doc.pipe(res);
    doc.end();
    return undefined;
  } catch (error) {
    return next(error);
  }
};

const formatoCampoPdf = async (req, res, next) => {
  try {
    const resultado = await obtenerInformeAuditoria(req.params.id, req);
    if (!resultado) return res.status(404).json({ message: 'Auditoria no encontrada' });

    const { auditoria } = resultado;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="formato-auditoria-${auditoria.codigo || auditoria.id}-${marcaFechaHora()}.pdf"`
    );

    const doc = construirFormatoCampo(auditoria);
    doc.pipe(res);
    doc.end();
    return undefined;
  } catch (error) {
    return next(error);
  }
};

export { informePdf, formatoCampoPdf };
