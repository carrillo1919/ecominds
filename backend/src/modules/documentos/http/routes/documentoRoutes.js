import express from 'express';
import multer from 'multer';

import validate from '../../../../shared/http/validation/validate.js';
import {
  paramId,
  paramDocumentoId,
  paramArchivoId,
  documentoCreateRules,
  documentoUpdateRules,
  documentoArchivoRules,
} from '../middlewares/validators.js';
import { authenticate, authorize, requireEmpresa, resolveScope } from '../../../../shared/security/auth.js';
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
router.use(resolveScope);

router.get('/', controller.getAll);

router.get('/:id', [paramId()], validate, controller.getOne);

router.post('/', authorize('admin', 'auditor', 'responsable'), documentoCreateRules, validate, controller.create);

router.put('/:id', authorize('admin', 'auditor', 'responsable'), documentoUpdateRules, validate, controller.update);

router.delete('/:id', authorize('admin', 'auditor', 'responsable'), [paramId()], validate, controller.remove);

router.post(
  '/:id/archivos',
  authorize('admin', 'auditor', 'responsable'),
  [paramId()],
  validate,
  upload.single('archivo'),
  controller.uploadArchivo,
);

router.delete(
  '/:documentoId/archivos/:archivoId',
  authorize('admin', 'auditor', 'responsable'),
  documentoArchivoRules,
  validate,
  controller.deleteArchivo,
);

router.get(
  '/:documentoId/archivos/:archivoId/download',
  documentoArchivoRules,
  validate,
  controller.downloadArchivo,
);

router.get(
  '/:documentoId/archivos/:archivoId/preview',
  documentoArchivoRules,
  validate,
  controller.previewArchivo,
);

export default router;