import express from 'express';

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import empresaRoutes from './empresaRoutes.js';
import requisitoRoutes from './requisitoRoutes.js';
import auditoriaRoutes from './auditoriaRoutes.js';

const router = express.Router();

router.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/empresas', empresaRoutes);
router.use('/requisitos', requisitoRoutes);
router.use('/auditorias', auditoriaRoutes);

export default router;
