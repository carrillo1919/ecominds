import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import { paramId, servicioCreateRules } from '../middlewares/validators.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/servicioController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', [paramId()], validate, controller.getById);
router.post('/', authorize('admin'), servicioCreateRules, validate, controller.create);
router.put('/:id', authorize('admin'), [paramId()], validate, controller.update);
router.delete('/:id', authorize('admin'), [paramId()], validate, controller.remove);

export default router;