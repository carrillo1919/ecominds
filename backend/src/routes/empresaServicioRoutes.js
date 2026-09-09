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
  body('productoId').optional({ values: 'falsy' }).isUUID(),
  body('servicioId').optional({ values: 'falsy' }).isUUID(),
  body('cantidad').isDecimal(),
  body('precioUnitario').optional({ values: 'falsy' }).isDecimal(),
  body('impuesto').optional({ values: 'falsy' }).isDecimal(),
], validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;
