import express from 'express';
import rateLimit from 'express-rate-limit';

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import empresaRoutes from './empresaRoutes.js';
import requisitoRoutes from './requisitoRoutes.js';
import auditoriaRoutes from './auditoriaRoutes.js';
import empleadoRoutes from './empleadoRoutes.js';
import documentoRoutes from './documentoRoutes.js';
import enteReguladorRoutes from './enteReguladorRoutes.js';
import requisitoLegalRoutes from './requisitoLegalRoutes.js';
import empresaRequisitoRoutes from './empresaRequisitoRoutes.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Intente más tarde.' },
});

router.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/empresas', empresaRoutes);
router.use('/requisitos', requisitoRoutes);
router.use('/auditorias', auditoriaRoutes);
router.use('/empleados', empleadoRoutes);
router.use('/documentos', documentoRoutes);
router.use('/entes-reguladores', enteReguladorRoutes);
router.use('/requisitos-legales', requisitoLegalRoutes);
router.use('/empresa-requisitos', empresaRequisitoRoutes);

export default router;
