import express from 'express';
import { getConfig, updateConfig } from '../controllers/notificacionConfigController.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import { notificacionConfigUpdateRules } from '../middlewares/validators.js';
import validate from '../../../../shared/http/validation/validate.js';

const router = express.Router();

router.get('/config', authenticate, authorize('admin'), getConfig);
router.put('/config/:id', authenticate, authorize('admin'), notificacionConfigUpdateRules, validate, updateConfig);

export default router;