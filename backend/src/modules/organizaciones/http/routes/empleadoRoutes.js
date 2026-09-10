import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  empleadoCreateRules,
  empleadoUpdateRules,
  empleadoAsignarUsuarioRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/empleadoController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/', controller.getAll);
router.get('/activos', controller.getActivos);

router.get('/:id', [paramId()], validate, controller.getOne);

router.post('/', authorize('admin', 'responsable'), empleadoCreateRules, validate, controller.create);

// POST /:id/usuario — solo admin puede crear/asignar usuario a un empleado
router.post(
  '/:id/usuario',
  authorize('admin'),
  empleadoAsignarUsuarioRules,
  validate,
  controller.asignarUsuario,
);

router.put('/:id', authorize('admin', 'responsable'), empleadoUpdateRules, validate, controller.update);

router.delete('/:id', authorize('admin', 'responsable'), [paramId()], validate, controller.remove);

export default router;