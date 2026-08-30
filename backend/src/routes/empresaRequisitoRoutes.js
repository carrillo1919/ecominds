import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/empresaRequisitoController.js';

const router = express.Router();
router.use(authenticate);

router.get('/empresa/:empresaId', [param('empresaId').isUUID()], validate, controller.getByEmpresa);
router.post('/', authorize('admin', 'auditor'), [
  body('empresaId').isUUID(),
  body('requisitoId').isUUID(),
  body('responsableId').optional({ values: 'falsy' }).isUUID(),
], validate, controller.assign);
router.post('/bulk', authorize('admin', 'auditor'), [
  body('empresaId').isUUID(),
  body('requisitoIds').isArray({ min: 1 }),
  body('responsableId').optional({ values: 'falsy' }).isUUID(),
], validate, controller.bulkAssign);
router.put('/:id', authorize('admin', 'auditor'), [
  param('id').isUUID(),
  body('responsableId').optional({ values: 'falsy' }).isUUID(),
], validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;