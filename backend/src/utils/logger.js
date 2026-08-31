import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
  base: { pid: process.pid },
});

/**
 * Registra un evento de seguridad.
 * No incluye datos sensibles (contraseñas, tokens, emails en claro).
 */
const logSecurityEvent = (evento, datos = {}) => {
  logger.info({ tipo: 'security', evento, ...datos });
};

export { logger, logSecurityEvent };
export default logger;
