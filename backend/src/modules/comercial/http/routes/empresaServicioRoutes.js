import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import { paramId, empresaServicioCreateRules, empresaServicioUpdateRules } from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/empresaServicioController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.post('/', authorize('admin', 'auditor'), empresaServicioCreateRules, validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), empresaServicioUpdateRules, validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;