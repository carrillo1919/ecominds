const notFound = (req, res) => res.status(404).json({
  message: 'Recurso no encontrado',
});

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[error]', err);

  const status = err.status || (
    err.name === 'SequelizeUniqueConstraintError' ? 409 : 500
  );

  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message;

  return res.status(status).json({
    message,
    details: err.details,
  });
};

export { notFound, errorHandler };
