import express from 'express';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize, requireEmpresa } from '../middlewares/auth.js';
import * as controller from '../controllers/empleadoController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireEmpresa);

router.get('/', controller.getAll);
router.get('/activos', controller.getActivos);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Identificador inválido')],
  validate,
  controller.getOne,
);

router.post(
  '/',
  authorize('admin', 'responsable'),
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
    body('cedula').trim().notEmpty().withMessage('La cédula es obligatoria'),
    body('email').isEmail().withMessage('Correo inválido'),
  ],
  validate,
  controller.create,
);

// POST /:id/usuario — solo admin puede crear/asignar usuario a un empleado
router.post(
  '/:id/usuario',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador inválido'),
    body('rolUsuario')
      .optional()
      .isIn(['admin', 'auditor', 'responsable', 'lector'])
      .withMessage('Rol inválido'),
  ],
  validate,
  controller.asignarUsuario,
);

router.put(
  '/:id',
  authorize('admin', 'responsable'),
  [
    param('id').isUUID().withMessage('Identificador inválido'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Correo inválido'),
  ],
  validate,
  controller.update,
);

router.delete(
  '/:id',
  authorize('admin', 'responsable'),
  [param('id').isUUID().withMessage('Identificador inválido')],
  validate,
  controller.remove,
);

export default router;
