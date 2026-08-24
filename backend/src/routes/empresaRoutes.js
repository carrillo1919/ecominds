import express from 'express';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/empresaController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getAll);
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  controller.getOne
);

router.post(
  '/',
  authorize('admin', 'auditor'),
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('rif').trim().notEmpty().withMessage('El RIF es obligatorio'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Correo invalido'),
  ],
  validate,
  controller.create
);

router.put(
  '/:id',
  authorize('admin', 'auditor'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('nombre')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('El nombre es obligatorio'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Correo invalido'),
  ],
  validate,
  controller.update
);

export default router;
