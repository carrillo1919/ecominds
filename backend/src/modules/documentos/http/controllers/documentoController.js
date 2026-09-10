import {
  listarDocumentos,
  obtenerDocumento,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  adjuntarArchivo,
  eliminarArchivo,
  obtenerArchivo,
} from '../../application/documentoService.js';

// GET /api/documentos
const getAll = async (req, res, next) => {
  try {
    const documentos = await listarDocumentos(req);
    return res.json({ documentos });
  } catch (error) {
    return next(error);
  }
};

// GET /api/documentos/:id
const getOne = async (req, res, next) => {
  try {
    const documento = await obtenerDocumento(req.params.id, req);
    return res.json({ documento });
  } catch (error) {
    return next(error);
  }
};

// POST /api/documentos
const create = async (req, res, next) => {
  try {
    const documento = await crearDocumento(req);
    return res.status(201).json({ message: 'Documento creado', documento });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/documentos/:id
const update = async (req, res, next) => {
  try {
    const documento = await actualizarDocumento(req.params.id, req);
    return res.json({ message: 'Documento actualizado', documento });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/documentos/:id — borrado físico
const remove = async (req, res, next) => {
  try {
    await eliminarDocumento(req.params.id, req);
    return res.json({ message: 'Documento eliminado' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/documentos/:id/archivos  (multer memoryStorage)
const uploadArchivo = async (req, res, next) => {
  try {
    const archivo = await adjuntarArchivo(req.params.id, req);
    return res.status(201).json({
      message: 'Archivo adjuntado',
      archivo: {
        id: archivo.id,
        nombreArchivo: archivo.nombreArchivo,
        tipoMime: archivo.tipoMime,
        tamano: archivo.tamano,
        createdAt: archivo.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/documentos/:documentoId/archivos/:archivoId
const deleteArchivo = async (req, res, next) => {
  try {
    await eliminarArchivo(req.params.documentoId, req.params.archivoId, req);
    return res.json({ message: 'Archivo eliminado' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/documentos/:documentoId/archivos/:archivoId/download
const downloadArchivo = async (req, res, next) => {
  try {
    const archivo = await obtenerArchivo(req.params.documentoId, req.params.archivoId, req);
    const contentType = archivo.tipoMime || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(archivo.nombreArchivo)}"`);
    if (archivo.tamano) res.setHeader('Content-Length', archivo.tamano);
    return res.end(archivo.contenido);
  } catch (error) {
    return next(error);
  }
};

// GET /api/documentos/:documentoId/archivos/:archivoId/preview
const previewArchivo = async (req, res, next) => {
  try {
    const archivo = await obtenerArchivo(req.params.documentoId, req.params.archivoId, req);
    const contentType = archivo.tipoMime || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.nombreArchivo)}"`);
    if (archivo.tamano) res.setHeader('Content-Length', archivo.tamano);
    return res.end(archivo.contenido);
  } catch (error) {
    return next(error);
  }
};

export {
  getAll,
  getOne,
  create,
  update,
  remove,
  uploadArchivo,
  deleteArchivo,
  downloadArchivo,
  previewArchivo,
};
