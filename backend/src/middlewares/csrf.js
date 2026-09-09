import { doubleCsrf } from 'csrf-csrf';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
  generateCsrfToken,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.ip || 'anonymous',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  },
  size: 64,
  getTokenFromRequest: (req) => {
    const token = req.headers['x-csrf-token'];
    if (typeof token === 'string' && token.length > 0) return token;
    if (typeof req.body?._csrf === 'string' && req.body._csrf.length > 0) return req.body._csrf;
    if (typeof req.query?._csrf === 'string' && req.query._csrf.length > 0) return req.query._csrf;
    return undefined;
  },
});

const csrfErrorHandler = (error, req, res, next) => {
  if (error === invalidCsrfTokenError) {
    logger.warn({ event: 'csrf_validation_failed', ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ message: 'Token CSRF inválido' });
  }
  return next(error);
};

export { doubleCsrfProtection, generateCsrfToken, csrfErrorHandler };
