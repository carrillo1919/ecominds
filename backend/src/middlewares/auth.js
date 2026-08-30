import jwt from 'jsonwebtoken';
import { User, Empleado } from '../models/index.js';

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
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
 * Inyecta req.empresaId y req.empleado.
 * Los admins pueden operar sin empleado; en ese caso req.empresaId queda undefined
 * y los controllers deben manejar el acceso global.
 */
const requireEmpresa = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });

    if (req.user.rol === 'admin') {
      return next();
    }

    const empleado = await Empleado.findOne({
      where: { userId: req.user.id, activo: true },
    });

    if (!empleado) {
      return res.status(403).json({
        message: 'No tiene un perfil de empleado activo en ninguna empresa',
      });
    }

    req.empleado = empleado;
    req.empresaId = empleado.empresaId;
    return next();
  } catch (error) {
    return next(error);
  }
};

export { authenticate, authorize, requireEmpresa };
