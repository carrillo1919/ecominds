import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  facturaCreateRules,
  facturaUpdateRules,
  facturaCambiarEstadoRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/facturaController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.get('/:id/pdf', [paramId()], validate, controller.verPdf);
router.get('/:id', [paramId()], validate, controller.getById);
router.post('/', authorize('admin', 'auditor'), facturaCreateRules, validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), facturaUpdateRules, validate, controller.update);
router.patch('/:id/estado', authorize('admin', 'auditor'), facturaCambiarEstadoRules, validate, controller.cambiarEstado);
router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;