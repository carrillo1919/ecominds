import express from 'express';
import { body, query } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import * as controller from '../controllers/authController.js';

const passwordValidator = body('password')
  .isLength({ min: 8, max: 128 }).withMessage('La contraseña debe tener entre 8 y 128 caracteres')
  .matches(/[A-Z]/).withMessage('Debe incluir al menos una mayúscula')
  .matches(/[a-z]/).withMessage('Debe incluir al menos una minúscula')
  .matches(/[0-9]/).withMessage('Debe incluir al menos un número')
  .matches(/[^A-Za-z0-9]/).withMessage('Debe incluir al menos un carácter especial');

const router = express.Router();

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('email').isEmail().withMessage('Correo invalido').normalizeEmail(),
    passwordValidator,
    body('confirmPassword')
      .optional()
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Las contrasenas no coinciden'),
  ],
  validate,
  controller.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Correo invalido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contrasena es obligatoria'),
  ],
  validate,
  controller.login
);

router.get(
  '/verify-email',
  [query('token').notEmpty().withMessage('Token no proporcionado')],
  validate,
  controller.verifyEmail
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Correo invalido').normalizeEmail()],
  validate,
  controller.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token no proporcionado'),
    passwordValidator,
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Las contrasenas no coinciden'),
  ],
  validate,
  controller.resetPassword
);

router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export default router;
