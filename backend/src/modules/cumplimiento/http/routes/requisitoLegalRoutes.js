import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  requisitoLegalCreateRules,
  requisitoLegalPatchRules,
} from '../middlewares/validators.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/requisitoLegalController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [paramId()], validate, controller.getOne);
router.post('/', authorize('admin', 'auditor'), requisitoLegalCreateRules, validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.update);
router.patch('/:id', authorize('admin', 'auditor'), requisitoLegalPatchRules, validate, controller.patchConfig);
router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;