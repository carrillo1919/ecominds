import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../middlewares/auth.js';
import * as controller from '../controllers/facturaController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.get('/:id/pdf', [param('id').isUUID()], validate, controller.verPdf);
router.get('/:id', [param('id').isUUID()], validate, controller.getById);
router.post('/', authorize('admin', 'auditor'), [
  body('empresaId').isUUID(),
  body('asignacionIds').isArray({ min: 1 }),
], validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.update);
router.patch('/:id/estado', authorize('admin', 'auditor'), [
  param('id').isUUID(),
  body('estado').isIn(['borrador', 'emitida', 'pagada', 'anulada']),
  body('fechaPago').if(body('estado').equals('pagada')).isISO8601(),
  body('metodoPago').if(body('estado').equals('pagada')).isIn(['transferencia', 'pago_movil', 'efectivo', 'usd']),
  body('montoPago').if(body('estado').equals('pagada')).isFloat({ gt: 0 }),
  body('referenciaPago').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
  body('bancoPago').optional({ values: 'falsy' }).isString().isLength({ max: 150 }),
  body('telefonoPago').optional({ values: 'falsy' }).isString().isLength({ max: 30 }),
], validate, controller.cambiarEstado);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;
