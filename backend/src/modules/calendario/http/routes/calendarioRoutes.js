import { Router } from 'express';
import { authenticate, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  calendarioEventoCreateRules,
  calendarioEventoUpdateRules,
  calendarioAuditoriaCreateRules,
  calendarioEventosQueryRules,
} from '../middlewares/validators.js';
import {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  crearAuditoria,
} from '../controllers/calendarioController.js';

const router = Router();

router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/eventos', calendarioEventosQueryRules, validate, getEventos);
router.post('/eventos', calendarioEventoCreateRules, validate, crearEvento);
router.put('/eventos/:id', calendarioEventoUpdateRules, validate, actualizarEvento);
router.delete('/eventos/:id', [paramId()], validate, eliminarEvento);
router.post('/auditorias', calendarioAuditoriaCreateRules, validate, crearAuditoria);

export default router;