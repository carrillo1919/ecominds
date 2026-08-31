import { Auditoria, AuditoriaItem, Requisito, Empresa, User } from '../models/index.js';
import { calcularResultado } from '../services/riesgoService.js';
import { construirInforme } from '../services/pdfService.js';
import { resolveEmpresaWhere } from '../utils/authorization.js';

// GET /api/auditorias/:id/informe.pdf  (RF-06.1)
const informePdf = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveEmpresaWhere(req) };
    const auditoria = await Auditoria.findOne({
      where,
      include: [
        { model: Empresa, as: 'empresa' },
        { model: User, as: 'auditor', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: AuditoriaItem, as: 'items', include: [{ model: Requisito, as: 'requisito' }] },
      ],
    });

    if (!auditoria) return res.status(404).json({ message: 'Auditoria no encontrada' });

    const plain = auditoria.toJSON();
    plain.items = (plain.items || []).sort((a, b) => (a.requisito?.orden || 0) - (b.requisito?.orden || 0));

    const resumen = calcularResultado(plain.items);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe-${plain.codigo || plain.id}.pdf"`
    );

    const doc = construirInforme(plain, resumen);
    doc.pipe(res);
    doc.end();
    return undefined;
  } catch (error) {
    return next(error);
  }
};

export { informePdf };
