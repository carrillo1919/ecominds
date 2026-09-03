import express from 'express';
import { getConfig, updateConfig } from '../controllers/notificacionConfigController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getConfig);
router.put('/:id', authenticate, authorize('admin'), updateConfig);

export default router;