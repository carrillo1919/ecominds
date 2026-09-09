import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../middlewares/auth.js';
import * as controller from '../controllers/empresaServicioController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.post('/', authorize('admin', 'auditor'), [
  body('empresaId').isUUID(),
  body('productoId').optional().isUUID(),
  body('servicioId').optional().isUUID(),
  body('cantidad').isDecimal(),
  body('precioUnitario').optional().isDecimal(),
  body('impuesto').optional().isDecimal(),
], validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;
