import express from 'express';

import { authenticate, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
import validate from '../../../../shared/http/validation/validate.js';
import { dashboardReportesRules } from '../middlewares/validators.js';
import * as controller from '../controllers/reportesController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireEmpresa);
router.use(resolveScope);

router.get('/dashboard', dashboardReportesRules, validate, controller.dashboard);
router.get('/dashboard/export/pdf', dashboardReportesRules, validate, controller.exportarPdf);
router.get('/dashboard/export/excel', dashboardReportesRules, validate, controller.exportarExcel);

export default router;
