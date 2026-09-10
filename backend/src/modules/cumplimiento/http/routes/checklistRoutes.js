import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  checklistCreateRules,
  checklistEditRules,
  checklistUpdateRules,
} from '../middlewares/validators.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/checklistController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getAll);

router.post('/', authorize('admin'), checklistCreateRules, validate, controller.create);

router.put('/:id', authorize('admin'), checklistEditRules, validate, controller.edit);

router.patch(
  '/:id',
  authorize('admin'),
  checklistUpdateRules,
  validate,
  controller.update
);

export default router;