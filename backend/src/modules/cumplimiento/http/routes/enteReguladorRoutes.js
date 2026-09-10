import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  enteReguladorCreateRules,
  enteReguladorUpdateRules,
} from '../middlewares/validators.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/enteReguladorController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [paramId()], validate, controller.getOne);
router.post('/', authorize('admin', 'auditor'), enteReguladorCreateRules, validate, controller.create);
router.put('/:id', authorize('admin', 'auditor'), enteReguladorUpdateRules, validate, controller.update);
router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;