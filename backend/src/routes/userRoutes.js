import express from 'express';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);

const passwordValidator = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
  .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una mayúscula')
  .matches(/[a-z]/).withMessage('La contraseña debe incluir al menos una minúscula')
  .matches(/[0-9]/).withMessage('La contraseña debe incluir al menos un número')
  .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe incluir al menos un carácter especial');

router.get('/me', controller.me);
router.get('/', authorize('admin'), controller.getAll);

router.post(
  '/',
  authorize('admin'),
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('email').isEmail().withMessage('Correo inválido'),
    passwordValidator,
    body('rol').isIn(['admin', 'auditor', 'responsable', 'lector']).withMessage('Rol inválido'),
    body('empresaIds').optional().isArray().withMessage('empresaIds debe ser un arreglo'),
    body('empresaIds.*').optional().isUUID().withMessage('empresaId inválido'),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('nombre').optional().trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').optional().trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('email').optional().isEmail().withMessage('Correo inválido'),
    body('activo').optional().isBoolean().withMessage('activo debe ser booleano'),
  ],
  validate,
  controller.update
);

router.patch(
  '/:id/rol',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('rol')
      .isIn(['admin', 'auditor', 'responsable', 'lector'])
      .withMessage('Rol invalido'),
  ],
  validate,
  controller.updateRol
);

router.get(
  '/:id/empresas',
  authorize('admin'),
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  controller.getEmpresas
);

router.post(
  '/:id/empresas',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('empresaIds').isArray().withMessage('empresaIds debe ser un arreglo'),
    body('empresaIds.*').isUUID().withMessage('empresaId inválido'),
  ],
  validate,
  controller.setEmpresas
);

router.delete(
  '/:id/empresas/:empresaId',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    param('empresaId').isUUID().withMessage('empresaId invalido'),
  ],
  validate,
  controller.removeEmpresa
);

export default router;
