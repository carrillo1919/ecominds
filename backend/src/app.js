import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { doubleCsrfProtection, csrfErrorHandler, generateCsrfToken } from './middlewares/csrf.js';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

// Confía en el proxy reverso de Render para obtener la IP real del cliente
if (isProduction) {
  app.set('trust proxy', 1);
}

if (isProduction && !frontendUrl) {
  throw new Error('FRONTEND_URL debe estar definida en producción');
}

const allowedOrigins = (frontendUrl )
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler(req, res, _next, options) {
    const retryAfter = req.rateLimit?.resetTime
      ? Math.max(1, Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);

    logger.warn({
      event: 'auth_rate_limit_exceeded',
      ip: req.ip,
      path: req.originalUrl,
      retryAfter,
    });

    return res.status(options.statusCode).json({
      message: 'Demasiados intentos. Intente más tarde.',
      retryAfter,
    });
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", ...(frontendUrl ? frontendUrl.split(',').map((o) => o.trim().replace(/\/$/, '')) : [])],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      // No se lanza error: se responde sin cabeceras CORS y el navegador bloquea la peticion.
      logger.warn({ event: 'cors_origin_blocked', origin });
      return callback(null, false);
    },
    credentials: true,
  })
);


app.use(cookieParser()); 
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(limiter);

app.use('/api/auth', authLimiter);
app.use('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});
app.use('/api', doubleCsrfProtection, routes);

app.use(notFound);
app.use(csrfErrorHandler);
app.use(errorHandler);

export default app;
