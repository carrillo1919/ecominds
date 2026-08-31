import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

const notFound = (req, res) => res.status(404).json({
  message: 'Recurso no encontrado',
});

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method, ip: req.ip }, '[error]');

  const status = err.status || (
    err.name === 'SequelizeUniqueConstraintError' ? 409 : 500
  );

  const message =
    status === 500 && isProduction
      ? 'Error interno del servidor'
      : err.message;

  const response = { message };
  if (!isProduction && err.details) {
    response.details = err.details;
  }

  return res.status(status).json(response);
};

export { notFound, errorHandler };
