import { construirInforme } from '../../application/pdfService.js';
import { obtenerInformeAuditoria } from '../../application/reporteService.js';

// GET /api/auditorias/:id/informe.pdf  (RF-06.1)
const informePdf = async (req, res, next) => {
  try {
    const resultado = await obtenerInformeAuditoria(req.params.id, req);
    if (!resultado) return res.status(404).json({ message: 'Auditoria no encontrada' });

    const { auditoria, resumen } = resultado;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-${auditoria.codigo || auditoria.id}.pdf"`
    );

    const doc = construirInforme(auditoria, resumen);
    doc.pipe(res);
    doc.end();
    return undefined;
  } catch (error) {
    return next(error);
  }
};

export { informePdf };
