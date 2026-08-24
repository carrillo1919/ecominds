import express from 'express';
import { body, param } from 'express-validator';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/enteReguladorController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [param('id').isUUID()], validate, controller.getOne);
router.post('/', authorize('admin', 'auditor'), [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('sigla').trim().notEmpty().withMessage('La sigla es obligatoria'),
  body('ambito').optional().isIn(['nacional', 'departamental', 'municipal', 'sectorial']),
  body('sitioWeb').optional({ values: 'falsy' }).isURL().withMessage('URL inválida'),
], validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [
  param('id').isUUID(),
  body('nombre').optional().trim().notEmpty(),
  body('ambito').optional().isIn(['nacional', 'departamental', 'municipal', 'sectorial']),
], validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [param('id').isUUID()], validate, controller.remove);

export default router;