import express from 'express';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  auditoriaEstadisticasRules,
  auditoriaProximasRules,
  auditoriaCreateRules,
  auditoriaUpdateRules,
  auditoriaSaveItemsRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import * as controller from '../controllers/auditoriaController.js';
import * as reportes from '../controllers/reporteController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/estadisticas', auditoriaEstadisticasRules, validate, controller.estadisticas);
router.get('/proximas', auditoriaProximasRules, validate, controller.proximas);
router.get('/', controller.getAll);

router.get('/:id/informe.pdf', [paramId()], validate, reportes.informePdf);
router.get('/:id', [paramId()], validate, controller.getOne);

router.post('/', authorize('admin', 'auditor'), auditoriaCreateRules, validate, controller.create);

router.patch('/:id', authorize('admin', 'auditor'), auditoriaUpdateRules, validate, controller.update);

router.put('/:id/items', authorize('admin', 'auditor'), auditoriaSaveItemsRules, validate, controller.saveItems);

router.post('/:id/finalizar', authorize('admin', 'auditor'), [paramId()], validate, controller.finalizar);

router.delete('/:id', authorize('admin', 'auditor'), [paramId()], validate, controller.remove);

export default router;