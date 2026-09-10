import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  userCreateRules,
  userUpdateRules,
  userUpdateRolRules,
  userSetEmpresasRules,
  userRemoveEmpresaRules,
} from '../middlewares/validators.js';
import { authenticate, authorize } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', controller.me);
router.get('/', authorize('admin'), controller.getAll);

router.post('/', authorize('admin'), userCreateRules, validate, controller.create);

router.put('/:id', authorize('admin'), userUpdateRules, validate, controller.update);

router.patch('/:id/rol', authorize('admin'), userUpdateRolRules, validate, controller.updateRol);

router.get('/:id/empresas', authorize('admin'), [paramId()], validate, controller.getEmpresas);

router.post('/:id/empresas', authorize('admin'), userSetEmpresasRules, validate, controller.setEmpresas);

router.delete(
  '/:id/empresas/:empresaId',
  authorize('admin'),
  userRemoveEmpresaRules,
  validate,
  controller.removeEmpresa
);

export default router;