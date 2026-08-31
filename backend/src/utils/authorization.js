/**
 * Resuelve el filtro de empresa para controladores con aislamiento de tenant.
 * - admin/auditor: visibilidad global; si envían ?empresaId filtran por esa empresa.
 * - responsable/lector: solo ven su empresa asignada vía req.empresaId.
 */
const resolveEmpresaWhere = (req, options = {}) => {
  const { allowGlobal = true, empresaIdField = 'empresaId' } = options;

  if (!req.user) return null;

  const isPrivileged = ['admin', 'auditor'].includes(req.user.rol);

  if (isPrivileged) {
    if (!allowGlobal) {
      throw new Error('Rol no autorizado para visibilidad global');
    }
    if (req.query.empresaId) {
      return { [empresaIdField]: req.query.empresaId };
    }
    return {};
  }

  if (!req.empresaId) {
    return { [empresaIdField]: null };
  }

  return { [empresaIdField]: req.empresaId };
};

/**
 * Determina si el usuario autenticado puede acceder a una empresa específica.
 */
const puedeAccederEmpresa = (req, empresaId) => {
  if (!req.user || !empresaId) return false;
  if (['admin', 'auditor'].includes(req.user.rol)) return true;
  return req.empresaId === empresaId;
};

export { resolveEmpresaWhere, puedeAccederEmpresa };
