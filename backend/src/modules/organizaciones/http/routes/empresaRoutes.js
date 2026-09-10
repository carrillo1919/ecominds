import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  empresaCreateRules,
  empresaUpdateRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/empresaController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.get('/:id', [paramId()], validate, controller.getOne);

router.post('/', authorize('admin'), empresaCreateRules, validate, controller.create);

router.put('/:id', authorize('admin', 'auditor'), empresaUpdateRules, validate, controller.update);

router.delete('/:id', authorize('admin'), [paramId()], validate, controller.remove);

export default router;