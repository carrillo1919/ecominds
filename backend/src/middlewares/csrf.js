import { doubleCsrf } from 'csrf-csrf';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

const {
  invalidCsrfTokenError,
  doubleCsrfProtection,
  generateToken,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body?._csrf || req.query?._csrf,
});

const csrfErrorHandler = (error, req, res, next) => {
  if (error === invalidCsrfTokenError) {
    logger.warn({ event: 'csrf_validation_failed', ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ message: 'Token CSRF inválido' });
  }
  return next(error);
};

export { doubleCsrfProtection, generateToken, csrfErrorHandler };
