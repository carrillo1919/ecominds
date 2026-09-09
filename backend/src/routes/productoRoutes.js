import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/productoController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [param('id').isUUID()], validate, controller.getById);
router.post('/', authorize('admin'), [
  body('codigo').trim().notEmpty(),
  body('nombre').trim().notEmpty(),
  body('precio').isDecimal(),
  body('impuesto').optional().isDecimal(),
  body('activo').optional().isBoolean(),
], validate, controller.create);
router.put('/:id', authorize('admin'), [param('id').isUUID()], validate, controller.update);
router.delete('/:id', authorize('admin'), [param('id').isUUID()], validate, controller.remove);

export default router;
