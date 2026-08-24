import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

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

export { authenticate, authorize };
