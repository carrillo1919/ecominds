import express from 'express';
import { body, query } from 'express-validator';

import validate from '../middlewares/validate.js';
import * as controller from '../controllers/authController.js';

const router = express.Router();
const passwordValidation = () => body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('La contrasena debe tener entre 8 y 128 caracteres')
  .matches(/[A-Z]/)
  .withMessage('La contrasena debe incluir al menos una letra mayuscula')
  .matches(/[a-z]/)
  .withMessage('La contrasena debe incluir al menos una letra minuscula')
  .matches(/[0-9]/)
  .withMessage('La contrasena debe incluir al menos un numero')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('La contrasena debe incluir al menos un caracter especial');

router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('email').isEmail().withMessage('Correo invalido').normalizeEmail(),
    passwordValidation(),
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
    passwordValidation(),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Las contrasenas no coinciden'),
  ],
  validate,
  controller.resetPassword
);

export default router;
