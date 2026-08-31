import { Documento, ArchivoAdjunto, Empleado, Empresa, EmpresaRequisito, RequisitoLegal, EnteRegulador, CalendarioEvento } from '../models/index.js';
import { registrarAccion } from '../services/documentoAuditoriaService.js';
import path from 'path';
import { Sequelize } from 'sequelize';
const { Op } = Sequelize;

const ESTADOS = ['vigente', 'vencido', 'archivado'];

// Fecha de hoy en formato YYYY-MM-DD en zona local
const hoyStr = () => new Date().toISOString().slice(0, 10);

const diasHasta = (fechaVencimiento) => {
  const hoy = new Date(hoyStr());
  const venc = new Date(fechaVencimiento);
  const diff = venc - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Determina estado efectivo solo con la fecha de vencimiento
const estadoEfectivo = (doc) => {
  return doc.fechaVencimiento < hoyStr() ? 'vencido' : 'vigente';
};

// Indica si está próximo a vencer (15 días o menos, pero aún vigente)
const proximoAVencer = (doc) => {
  if (estadoEfectivo(doc) === 'vencido') return false;
  const dias = diasHasta(doc.fechaVencimiento);
  return dias <= 15;
};

// admin y auditor ven todas las empresas; demás solo la suya
const resolveWhere = (req) => {
  if (['admin', 'auditor'].includes(req.user.rol) && req.query.empresaId) {
    return { empresaId: req.query.empresaId };
  }
  if (['admin', 'auditor'].includes(req.user.rol)) {
    return {};
  }
  return { empresaId: req.empresaId };
};

// GET /api/documentos
const getAll = async (req, res, next) => {
  try {
    const hoy = hoyStr();
    const where = resolveWhere(req);

    // Filtro por estado calculado a partir de la fecha de vencimiento
    if (req.query.estado === 'vencido') {
      where.fechaVencimiento = { [Op.lt]: hoy };
    } else if (req.query.estado === 'vigente') {
      where.fechaVencimiento = { [Op.gte]: hoy };
    }

    const documentos = await Documento.findAll({
      where,
      order: [['fechaVencimiento', 'ASC']],
      include: [
        { model: Empleado, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'cargo'] },
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
        {
          model: EmpresaRequisito,
          as: 'empresaRequisito',
          include: [
            { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }] },
          ],
        },
      ],
    });

    const result = documentos.map((d) => {
      const json = d.toJSON();
      return {
        ...json,
        estadoEfectivo: estadoEfectivo(d),
        proximoAVencer: proximoAVencer(d),
        diasHastaVencimiento: diasHasta(d.fechaVencimiento),
      };
    });

    return res.json({ documentos: result });
  } catch (error) {
    return next(error);
  }
};

// GET /api/documentos/:id
const getOne = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const documento = await Documento.findOne({
      where,
      include: [
        { model: Empleado, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'cargo'] },
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
        {
          model: EmpresaRequisito,
          as: 'empresaRequisito',
          include: [
            { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }] },
          ],
        },
        {
          model: ArchivoAdjunto,
          as: 'archivos',
          attributes: ['id', 'nombreArchivo', 'tipoMime', 'tamano', 'createdAt'],
        },
      ],
    });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const json = documento.toJSON();
    return res.json({
      documento: {
        ...json,
        estadoEfectivo: estadoEfectivo(documento),
        proximoAVencer: proximoAVencer(documento),
        diasHastaVencimiento: diasHasta(documento.fechaVencimiento),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Valida que el responsable pertenezca a la empresa y esté activo
const validarResponsable = async (responsableId, empresaId) => {
  if (!responsableId) return true;
  const emp = await Empleado.findOne({ where: { id: responsableId, empresaId, activo: true } });
  return Boolean(emp);
};

// POST /api/documentos
const create = async (req, res, next) => {
  try {
    let empresaId;
    if (['admin', 'auditor'].includes(req.user.rol)) {
      empresaId = req.body.empresaId;
      if (!empresaId) return res.status(400).json({ message: 'empresaId es requerido' });
    } else {
      empresaId = req.empresaId;
    }

    const { empresaRequisitoId, descripcion, fechaDocumento, fechaVencimiento, responsableId } = req.body;

    if (!empresaRequisitoId) {
      return res.status(400).json({ message: 'Debe seleccionar un documento asignado' });
    }

    const asignacion = await EmpresaRequisito.findOne({
      where: { id: empresaRequisitoId, empresaId },
      include: [{ model: RequisitoLegal, as: 'requisito' }],
    });
    if (!asignacion) {
      return res.status(422).json({ message: 'El documento asignado no pertenece a esta empresa' });
    }

    if (responsableId && !(await validarResponsable(responsableId, empresaId))) {
      return res.status(422).json({ message: 'El responsable no pertenece a esta empresa o no está activo' });
    }

    const documento = await Documento.create({
      empresaId,
      empresaRequisitoId,
      responsableId: responsableId || null,
      titulo: String(asignacion.requisito.titulo).trim(),
      descripcion: descripcion || null,
      fechaDocumento: fechaDocumento || null,
      fechaVencimiento,
      estado: 'vigente',
    });

    await registrarAccion({
      documentoId: documento.id,
      empleadoId: req.empleado?.id || null,
      empresaId,
      accion: 'creado',
      detalle: { titulo: documento.titulo },
    });

    // Dentro de crear/actualizar, después de guardar el documento:
    // await crearEventosDocumento(documento, req.user?.id ?? req.userId, { transaction });

    await crearEventosDocumento(documento, req.user?.id ?? null);

    return res.status(201).json({ message: 'Documento creado', documento });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/documentos/:id
const update = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const empresaId = documento.empresaId;
    const { descripcion, fechaDocumento, fechaVencimiento, responsableId, estado } = req.body;

    if (responsableId !== undefined && !(await validarResponsable(responsableId, empresaId))) {
      return res.status(422).json({ message: 'El responsable no pertenece a esta empresa o no está activo' });
    }

    // El documento asignado no se puede cambiar en edición
    if (req.body.empresaRequisitoId !== undefined) {
      return res.status(422).json({ message: 'No se puede cambiar el documento asignado' });
    }
    if (descripcion !== undefined) documento.descripcion = descripcion || null;
    if (fechaDocumento !== undefined) documento.fechaDocumento = fechaDocumento ? String(fechaDocumento).trim() || null : null;
    if (fechaVencimiento !== undefined) {
      const fechaVencimientoNorm = fechaVencimiento ? String(fechaVencimiento).trim() || null : null;
      if (!fechaVencimientoNorm) return res.status(422).json({ message: 'fechaVencimiento es requerido' });
      documento.fechaVencimiento = fechaVencimientoNorm;
    }
    if (responsableId !== undefined) documento.responsableId = responsableId || null;
    if (estado !== undefined && ESTADOS.includes(estado)) documento.estado = estado;

    await documento.save();

    await registrarAccion({
      documentoId: documento.id,
      empleadoId: req.empleado?.id || null,
      empresaId,
      accion: 'editado',
      detalle: req.body,
    });

    await crearEventosDocumento(documento, req.user?.id ?? null);

    return res.json({ message: 'Documento actualizado', documento });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/documentos/:id — borrado físico
const remove = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const empresaId = documento.empresaId;
    const titulo = documento.titulo;

    await documento.destroy();

    await registrarAccion({
      documentoId: null,
      empleadoId: req.empleado?.id || null,
      empresaId,
      accion: 'eliminado',
      detalle: { titulo },
    });

    return res.json({ message: 'Documento eliminado' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/documentos/:id/archivos  (multer memoryStorage)
const uploadArchivo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    const where = { id: req.params.id, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    // Solo se permite un archivo por documento
    const existente = await ArchivoAdjunto.findOne({ where: { documentoId: documento.id } });
    if (existente) {
      return res.status(422).json({ message: 'El documento ya tiene un archivo adjunto. Elimínelo antes de subir uno nuevo.' });
    }

    // Guardar con el nombre del documento asignado manteniendo la extensión original
    const ext = path.extname(req.file.originalname) || '';
    const nombreSeguro = String(documento.titulo).trim().replace(/[\\/:*?"<>|]/g, '_');
    const nombreArchivo = `${nombreSeguro}${ext}`;

    const archivo = await ArchivoAdjunto.create({
      documentoId: documento.id,
      nombreArchivo,
      contenido: req.file.buffer,
      tipoMime: req.file.mimetype,
      tamano: req.file.size,
    });

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
    const where = { id: req.params.documentoId, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const archivo = await ArchivoAdjunto.findOne({
      where: { id: req.params.archivoId, documentoId: documento.id },
    });
    if (!archivo) return res.status(404).json({ message: 'Archivo no encontrado' });

    await archivo.destroy();
    return res.json({ message: 'Archivo eliminado' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/documentos/:documentoId/archivos/:archivoId/download
const downloadArchivo = async (req, res, next) => {
  try {
    const where = { id: req.params.documentoId, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const archivo = await ArchivoAdjunto.findOne({
      where: { id: req.params.archivoId, documentoId: documento.id },
    });
    if (!archivo) return res.status(404).json({ message: 'Archivo no encontrado' });

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
    const where = { id: req.params.documentoId, ...resolveWhere(req) };
    const documento = await Documento.findOne({ where });
    if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

    const archivo = await ArchivoAdjunto.findOne({
      where: { id: req.params.archivoId, documentoId: documento.id },
      attributes: ['id', 'nombreArchivo', 'tipoMime', 'tamano', 'contenido'],
    });
    if (!archivo) return res.status(404).json({ message: 'Archivo no encontrado' });

    const contentType = archivo.tipoMime || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(archivo.nombreArchivo)}"`);
    if (archivo.tamano) res.setHeader('Content-Length', archivo.tamano);

    return res.end(archivo.contenido);
  } catch (error) {
    return next(error);
  }
};

const COLORES = {
  documentoEmision: '#3b82f6',
  documentoVencimiento: '#8b5cf6',
};

const crearEventosDocumento = async (documento, usuarioId, options = {}) => {
  // Evita duplicados al actualizar el documento.
  await CalendarioEvento.destroy({
    where: { documentoId: documento.id },
    ...options,
  });

  const eventos = [];

  if (documento.fechaDocumento) {
    eventos.push({
      titulo: `Documento: ${documento.titulo}`,
      descripcion: documento.descripcion,
      fecha: documento.fechaDocumento,
      tipo: 'documento',
      documentoId: documento.id,
      usuarioId,
      color: COLORES.documentoEmision,
    });
  }

  if (documento.fechaVencimiento) {
    eventos.push({
      titulo: `Vencimiento: ${documento.titulo}`,
      descripcion: documento.descripcion,
      fecha: documento.fechaVencimiento,
      tipo: 'documento',
      documentoId: documento.id,
      usuarioId,
      color: COLORES.documentoVencimiento,
    });
  }

  if (eventos.length) {
    await CalendarioEvento.bulkCreate(eventos, options);
  }
};

export { getAll, getOne, create, update, remove, uploadArchivo, deleteArchivo, downloadArchivo, previewArchivo };
