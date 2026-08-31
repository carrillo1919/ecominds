import { Router } from 'express';
import { authenticate, requireEmpresa } from '../middlewares/auth.js';
import {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  crearAuditoria,
} from '../controllers/calendarioController.js';

const router = Router();

router.use(authenticate);

router.get('/eventos', getEventos);
router.post('/eventos', crearEvento);
router.put('/eventos/:id', actualizarEvento);
router.delete('/eventos/:id', eliminarEvento);
router.post('/auditorias', requireEmpresa, crearAuditoria);

export default router;