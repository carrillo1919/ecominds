import express from 'express';
import { getConfig, updateConfig } from '../controllers/notificacionConfigController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/config', authenticate, authorize('admin'), getConfig);
router.put('/config/:id', authenticate, authorize('admin'), updateConfig);

export default router;