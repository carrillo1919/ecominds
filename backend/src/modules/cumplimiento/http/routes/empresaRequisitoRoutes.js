import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramEmpresaId,
  paramId,
  empresaRequisitoAssignRules,
  empresaRequisitoBulkRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/empresaRequisitoController.js';

const router = express.Router();
router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/empresa/:empresaId', [paramEmpresaId()], validate, controller.getByEmpresa);
router.post('/', authorize('admin', 'auditor'), empresaRequisitoAssignRules, validate, controller.assign);
router.post('/bulk', authorize('admin', 'auditor'), empresaRequisitoBulkRules, validate, controller.bulkAssign);
router.put('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;