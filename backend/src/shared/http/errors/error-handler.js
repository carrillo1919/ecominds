import logger from '../../observability/logger.js';

const notFound = (req, res) => res.status(404).json({
  message: 'Recurso no encontrado',
});

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || (
    err.name === 'SequelizeUniqueConstraintError' ? 409 : 500
  );

  logger.error({
    event: 'unhandled_error',
    status,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message;

  return res.status(status).json({ message });
};

export { notFound, errorHandler };