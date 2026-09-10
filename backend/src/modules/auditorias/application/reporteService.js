import { Auditoria, AuditoriaItem, Requisito, Empresa, User } from '../../../models/index.js';
import { assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import { calcularResultado } from './risk-calculator.js';

export const obtenerInformeAuditoria = async (id, req) => {
  const auditoria = await Auditoria.findByPk(id, {
    include: [
      { model: Empresa, as: 'empresa' },
      { model: User, as: 'auditor', attributes: ['id', 'nombre', 'apellido', 'email'] },
      { model: AuditoriaItem, as: 'items', include: [{ model: Requisito, as: 'requisito' }] },
    ],
  });

  if (!auditoria) return null;
  assertEmpresaInScope(auditoria.empresaId, req);

  const plain = auditoria.toJSON();
  plain.items = (plain.items || []).sort((a, b) => (a.requisito?.orden || 0) - (b.requisito?.orden || 0));

  return { auditoria: plain, resumen: calcularResultado(plain.items) };
};
