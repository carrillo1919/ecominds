import HttpError from '../http/errors/http-error.js';

/**
 * Calcula el conjunto de empresaId a las que un usuario tiene acceso segun su rol.
 * - admin: acceso total (scope.all = true)
 * - auditor: empresas asignadas via EmpresaAsignacion (rolContexto = 'auditor')
 * - responsable: la empresa de su Empleado (req.empresaId, resuelto por requireEmpresa)
 * - lector: la empresa asignada via EmpresaAsignacion (rolContexto = 'lector'), a lo sumo una
 */
const buildScope = async ({ user, empresaId }, { EmpresaAsignacion }) => {
  if (!user) return { all: false, empresaIds: [], canWrite: false };

  if (user.rol === 'admin') {
    return { all: true, empresaIds: [], canWrite: true };
  }

  if (user.rol === 'auditor') {
    const asignaciones = await EmpresaAsignacion.findAll({
      where: { userId: user.id, rolContexto: 'auditor', activo: true },
      attributes: ['empresaId'],
    });
    return { all: false, empresaIds: asignaciones.map((a) => a.empresaId), canWrite: true };
  }

  if (user.rol === 'responsable') {
    return { all: false, empresaIds: empresaId ? [empresaId] : [], canWrite: true };
  }

  // lector
  const asignacion = await EmpresaAsignacion.findOne({
    where: { userId: user.id, rolContexto: 'lector', activo: true },
    attributes: ['empresaId'],
  });
  return { all: false, empresaIds: asignacion ? [asignacion.empresaId] : [], canWrite: false };
};

/**
 * Middleware que calcula req.scope = { all, empresaIds, canWrite } para el usuario autenticado.
 * Debe montarse despues de `authenticate` (y opcionalmente `requireEmpresa`).
 */
const resolveScope = (db) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    req.scope = await buildScope({ user: req.user, empresaId: req.empresaId }, db);
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Combina un `where` de Sequelize con el alcance de empresas del usuario.
 * Si el scope es global (admin) o no aplica filtro, retorna el `where` original.
 * Si el usuario no tiene empresas asignadas, fuerza un resultado vacio (empresaId IN []).
 */
const applyEmpresaScope = (where, req, empresaField = 'empresaId') => {
  const scope = req.scope;
  if (!scope || scope.all) return where;

  return {
    ...where,
    [empresaField]: scope.empresaIds.length ? scope.empresaIds : null,
  };
};

/**
 * Verifica que un empresaId puntual este dentro del alcance del usuario.
 * Lanza HttpError 403 si no lo esta (y el usuario no es admin).
 */
const assertEmpresaInScope = (empresaId, req) => {
  const scope = req.scope;
  if (!scope || scope.all) return;
  if (!empresaId || !scope.empresaIds.includes(empresaId)) {
    throw new HttpError(403, 'No tiene acceso a los datos de esta empresa');
  }
};

export { resolveScope, applyEmpresaScope, assertEmpresaInScope };
