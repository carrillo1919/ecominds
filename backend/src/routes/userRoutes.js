import express from 'express';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', controller.me);
router.get('/', authorize('admin'), controller.getAll);

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

export default router;
