import express from 'express';
import { body, param, query } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/auditoriaController.js';
import * as reportes from '../controllers/reporteController.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/estadisticas',
  [
    query('desde').optional().isISO8601().withMessage('Fecha desde invalida'),
    query('hasta').optional().isISO8601().withMessage('Fecha hasta invalida'),
  ],
  validate,
  controller.estadisticas
);

router.get(
  '/proximas',
  [query('dias').optional().isInt({ min: 1, max: 365 })],
  validate,
  controller.proximas
);

router.get('/', controller.getAll);

router.get(
  '/:id/informe.pdf',
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  reportes.informePdf
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  controller.getOne
);

router.post(
  '/',
  authorize('admin', 'auditor'),
  [
    body('empresaId').isUUID().withMessage('Debe seleccionar una empresa'),
    body('fecha').optional().isISO8601().withMessage('Fecha invalida'),
    body('fechaProximaAuditoria')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Fecha invalida'),
  ],
  validate,
  controller.create
);

router.patch(
  '/:id',
  authorize('admin', 'auditor'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('fecha').optional().isISO8601().withMessage('Fecha invalida'),
    body('fechaProximaAuditoria')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Fecha invalida'),
  ],
  validate,
  controller.update
);

router.put(
  '/:id/items',
  authorize('admin', 'auditor'),
  [
    param('id').isUUID().withMessage('Identificador invalido'),
    body('items').isArray().withMessage('Debe enviar los items evaluados'),
    body('items.*.id').isUUID().withMessage('Item invalido'),
    body('items.*.estado')
      .optional({ values: 'null' })
      .isIn(['cumple', 'no_cumple', 'na'])
      .withMessage('Estado invalido'),
  ],
  validate,
  controller.saveItems
);

router.post(
  '/:id/finalizar',
  authorize('admin', 'auditor'),
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  controller.finalizar
);

router.delete(
  '/:id',
  authorize('admin', 'auditor'),
  [param('id').isUUID().withMessage('Identificador invalido')],
  validate,
  controller.remove
);

export default router;
