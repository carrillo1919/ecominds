import express from 'express';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/requisitoController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getAll);

router.patch(
  '/:id',
  authorize('admin'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('critico').optional().isBoolean().withMessage('Valor invalido'),
    body('activo').optional().isBoolean().withMessage('Valor invalido'),
  ],
  validate,
  controller.update
);

export default router;
