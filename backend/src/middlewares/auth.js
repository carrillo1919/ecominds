import jwt from 'jsonwebtoken';
import { User, Empleado, EmpresaAsignacion } from '../models/index.js';
import { resolveScope as resolveScopeFactory } from '../utils/empresaScope.js';

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);

    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Sesión inválida' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: 'No tiene permisos para realizar esta acción',
      });
    }

    return next();
  };
};

/**
 * Middleware que resuelve la empresa del usuario autenticado a través de su Empleado.
 * Inyecta req.empresaId y req.empleado. Solo aplica al rol 'responsable'.
 * Admin, auditor y lector resuelven su alcance de empresas via resolveScope
 * (EmpresaAsignacion para auditor/lector, acceso total para admin).
 */
const requireEmpresa = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });

    if (req.user.rol !== 'responsable') {
      return next();
    }

    const empleado = await Empleado.findOne({
      where: { userId: req.user.id, activo: true },
    });

    if (!empleado) {
      return res.status(403).json({
        message: 'Su usuario no tiene un perfil de empleado activo asignado a una empresa. Contacte al administrador.',
      });
    }

    req.empleado = empleado;
    req.empresaId = empleado.empresaId;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware que calcula req.scope = { all, empresaIds, canWrite } segun el rol del usuario.
 * Debe montarse despues de `authenticate` (y de `requireEmpresa` si aplica al rol responsable).
 */
const resolveScope = resolveScopeFactory({ EmpresaAsignacion });

export { authenticate, authorize, requireEmpresa, resolveScope };
