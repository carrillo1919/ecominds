import express from 'express';

import authRoutes from '../modules/identidad/http/routes/authRoutes.js';
import userRoutes from '../modules/identidad/http/routes/userRoutes.js';
import empresaRoutes from '../modules/organizaciones/http/routes/empresaRoutes.js';
import empleadoRoutes from '../modules/organizaciones/http/routes/empleadoRoutes.js';
import checklistRoutes from '../modules/cumplimiento/http/routes/checklistRoutes.js';
import enteReguladorRoutes from '../modules/cumplimiento/http/routes/enteReguladorRoutes.js';
import requisitoLegalRoutes from '../modules/cumplimiento/http/routes/requisitoLegalRoutes.js';
import empresaRequisitoRoutes from '../modules/cumplimiento/http/routes/empresaRequisitoRoutes.js';
import auditoriaRoutes from '../modules/auditorias/http/routes/auditoriaRoutes.js';
import documentoRoutes from '../modules/documentos/http/routes/documentoRoutes.js';
import calendarioRoutes from '../modules/calendario/http/routes/calendarioRoutes.js';
import notificacionConfigRoutes from '../modules/notificaciones/http/routes/notificacionConfigRoutes.js';
import productoRoutes from '../modules/comercial/http/routes/productoRoutes.js';
import servicioRoutes from '../modules/comercial/http/routes/servicioRoutes.js';
import empresaServicioRoutes from '../modules/comercial/http/routes/empresaServicioRoutes.js';
import facturaRoutes from '../modules/comercial/http/routes/facturaRoutes.js';

const router = express.Router();

router.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/empresas', empresaRoutes);
router.use('/requisitos', checklistRoutes);
router.use('/auditorias', auditoriaRoutes);
router.use('/empleados', empleadoRoutes);
router.use('/documentos', documentoRoutes);
router.use('/entes-reguladores', enteReguladorRoutes);
router.use('/requisitos-legales', requisitoLegalRoutes);
router.use('/empresa-requisitos', empresaRequisitoRoutes);
router.use('/calendario', calendarioRoutes);
router.use('/notificaciones', notificacionConfigRoutes);
router.use('/productos', productoRoutes);
router.use('/servicios', servicioRoutes);
router.use('/empresa-servicios', empresaServicioRoutes);
router.use('/facturas', facturaRoutes);

export default router;
