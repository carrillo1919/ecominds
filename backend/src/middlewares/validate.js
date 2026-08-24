import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(422).json({
      message: 'Datos inválidos',
      errors: result.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }

  return next();
};

export default validate;
