import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/requisitoLegalController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [param('id').isUUID()], validate, controller.getOne);
router.post('/', authorize('admin', 'auditor'), [
  body('enteId').isUUID().withMessage('Ente regulador inválido'),
  body('codigo').trim().notEmpty().withMessage('El código es obligatorio'),
  body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
  body('categoria').trim().notEmpty().withMessage('La categoría es obligatoria'),
  body('periodicidad').optional().isIn(['unica', 'mensual', 'trimestral', 'semestral', 'anual']),
  body('criticidad').optional().isIn(['alta', 'media', 'baja']),
], validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.update);
router.patch('/:id', authorize('admin', 'auditor'), [
  param('id').isUUID(),
  body('criticidad').optional().isIn(['alta', 'media', 'baja']),
  body('vigenciaDesde').optional().isISO8601(),
  body('vigenciaHasta').optional().isISO8601(),
], validate, controller.patchConfig);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;