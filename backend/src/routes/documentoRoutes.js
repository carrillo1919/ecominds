import express from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';

import validate from '../middlewares/validate.js';
import { authenticate, authorize, requireEmpresa } from '../middlewares/auth.js';
import * as controller from '../controllers/documentoController.js';

const router = express.Router();

// Almacenamiento en memoria para guardar el buffer en la BD
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    const permitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (permitidos.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Tipo de archivo no permitido. Solo PDF e imágenes.');
    err.status = 415;
    return cb(err);
  }
});

router.use(authenticate);
router.use(requireEmpresa);

router.get('/', controller.getAll);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Identificador inválido')],
  validate,
  controller.getOne,
);

router.post(
  '/',
  authorize('admin', 'auditor', 'responsable'),
  [
    body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
    body('empresaId').optional({ values: 'falsy' }).isUUID().withMessage('empresaId inválido'),
    body('fechaVencimiento').isDate().withMessage('Fecha de vencimiento inválida'),
    body('responsableId').optional({ values: 'falsy' }).isUUID().withMessage('responsableId inválido'),
  ],
  validate,
  controller.create,
);

router.put(
  '/:id',
  authorize('admin', 'auditor', 'responsable'),
  [
    param('id').isUUID().withMessage('Identificador inválido'),
    body('fechaVencimiento').optional().isDate().withMessage('Fecha de vencimiento inválida'),
    body('responsableId').optional({ values: 'falsy' }).isUUID().withMessage('responsableId inválido'),
    body('estado').optional().isIn(['vigente', 'vencido', 'archivado']).withMessage('Estado inválido'),
  ],
  validate,
  controller.update,
);

router.delete(
  '/:id',
  authorize('admin', 'auditor', 'responsable'),
  [param('id').isUUID().withMessage('Identificador inválido')],
  validate,
  controller.remove,
);

router.post(
  '/:id/archivos',
  authorize('admin', 'auditor', 'responsable'),
  [param('id').isUUID().withMessage('Identificador inválido')],
  validate,
  upload.single('archivo'),
  controller.uploadArchivo,
);

router.delete(
  '/:documentoId/archivos/:archivoId',
  authorize('admin', 'auditor', 'responsable'),
  [
    param('documentoId').isUUID().withMessage('Identificador de documento inválido'),
    param('archivoId').isUUID().withMessage('Identificador de archivo inválido'),
  ],
  validate,
  controller.deleteArchivo,
);

router.get(
  '/:documentoId/archivos/:archivoId/download',
  [
    param('documentoId').isUUID().withMessage('Identificador de documento inválido'),
    param('archivoId').isUUID().withMessage('Identificador de archivo inválido'),
  ],
  validate,
  controller.downloadArchivo,
);

export default router;
