import { Documento, ArchivoAdjunto, Empleado, Empresa, EmpresaRequisito, RequisitoLegal, EnteRegulador, CalendarioEvento, NotificacionLog } from '../../../models/index.js';
import { registrarAccion } from './documentoAuditoriaService.js';
import { enviarCorreoDocumentoCargado } from './emailService.js';
import { buildDocumentoCargado } from '../infrastructure/email/documentoCargado.js';
import { buildEmailTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { applyEmpresaScope, assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import { Sequelize } from 'sequelize';
import path from 'path';

const { Op } = Sequelize;
const ESTADOS = ['vigente', 'vencido', 'archivado'];

const COLORES = {
  documentoEmision: '#3b82f6',
  documentoVencimiento: '#8b5cf6',
};

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

const resolveWhere = (req) => {
  const where = applyEmpresaScope({}, req);
  if (req.query.empresaId) {
    assertEmpresaInScope(req.query.empresaId, req);
    where.empresaId = req.query.empresaId;
  }
  return where;
};

const DOCUMENTO_INCLUDES = [
  { model: Empleado, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'cargo'] },
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
  {
    model: EmpresaRequisito,
    as: 'empresaRequisito',
    include: [
      { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente', attributes: ['id', 'nombre', 'sigla'] }] },
    ],
  },
];

const ARCHIVOS_INCLUDE = {
  model: ArchivoAdjunto,
  as: 'archivos',
  attributes: ['id', 'nombreArchivo', 'tipoMime', 'tamano', 'createdAt'],
};

const enriquecerDocumento = (doc) => {
  const json = doc.toJSON();
  return {
    ...json,
    estadoEfectivo: estadoEfectivo(doc),
    proximoAVencer: proximoAVencer(doc),
    diasHastaVencimiento: diasHasta(doc.fechaVencimiento),
  };
};

export const listarDocumentos = async (req) => {
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
    include: DOCUMENTO_INCLUDES,
  });

  return documentos.map(enriquecerDocumento);
};

export const obtenerDocumento = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const documento = await Documento.findOne({
    where,
    include: [...DOCUMENTO_INCLUDES, ARCHIVOS_INCLUDE],
  });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }
  return enriquecerDocumento(documento);
};

export const crearDocumento = async (req) => {
  const empresaId = (req.scope?.all || req.user.rol === 'auditor')
    ? req.body.empresaId
    : (req.body.empresaId || req.scope?.empresaIds?.[0]);
  if (!empresaId) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  assertEmpresaInScope(empresaId, req);

  const { empresaRequisitoId, descripcion, fechaDocumento, fechaVencimiento, responsableId } = req.body;

  if (!empresaRequisitoId) {
    throw new HttpError(400, 'Debe seleccionar un documento asignado');
  }

  const asignacion = await EmpresaRequisito.findOne({
    where: { id: empresaRequisitoId, empresaId },
    include: [{ model: RequisitoLegal, as: 'requisito' }],
  });
  if (!asignacion) {
    throw new HttpError(422, 'El documento asignado no pertenece a esta empresa');
  }

  if (responsableId && !(await validarResponsable(responsableId, empresaId))) {
    throw new HttpError(422, 'El responsable no pertenece a esta empresa o no está activo');
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

  await crearEventosDocumento(documento, req.user?.id ?? null);
  await notificarDocumentoCargado(documento);

  return documento;
};

export const actualizarDocumento = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const documento = await Documento.findOne({ where });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }

  const empresaId = documento.empresaId;
  const { descripcion, fechaDocumento, fechaVencimiento, responsableId, estado } = req.body;

  if (responsableId !== undefined && !(await validarResponsable(responsableId, empresaId))) {
    throw new HttpError(422, 'El responsable no pertenece a esta empresa o no está activo');
  }

  // El documento asignado no se puede cambiar en edición
  if (req.body.empresaRequisitoId !== undefined) {
    throw new HttpError(422, 'No se puede cambiar el documento asignado');
  }
  if (descripcion !== undefined) documento.descripcion = descripcion || null;
  if (fechaDocumento !== undefined) documento.fechaDocumento = fechaDocumento ? String(fechaDocumento).trim() || null : null;
  if (fechaVencimiento !== undefined) {
    const fechaVencimientoNorm = fechaVencimiento ? String(fechaVencimiento).trim() || null : null;
    if (!fechaVencimientoNorm) {
      throw new HttpError(422, 'fechaVencimiento es requerido');
    }
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

  return documento;
};

export const eliminarDocumento = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const documento = await Documento.findOne({ where });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }

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
};

export const adjuntarArchivo = async (documentoId, req) => {
  if (!req.file) {
    throw new HttpError(400, 'No se recibió ningún archivo');
  }

  const where = { id: documentoId, ...resolveWhere(req) };
  const documento = await Documento.findOne({ where });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }

  // Solo se permite un archivo por documento
  const existente = await ArchivoAdjunto.findOne({ where: { documentoId: documento.id } });
  if (existente) {
    throw new HttpError(422, 'El documento ya tiene un archivo adjunto. Elimínelo antes de subir uno nuevo.');
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

  return archivo;
};

export const eliminarArchivo = async (documentoId, archivoId, req) => {
  const where = { id: documentoId, ...resolveWhere(req) };
  const documento = await Documento.findOne({ where });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }

  const archivo = await ArchivoAdjunto.findOne({
    where: { id: archivoId, documentoId: documento.id },
  });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }

  await archivo.destroy();
};

export const obtenerArchivo = async (documentoId, archivoId, req) => {
  const where = { id: documentoId, ...resolveWhere(req) };
  const documento = await Documento.findOne({ where });
  if (!documento) {
    throw new HttpError(404, 'Documento no encontrado');
  }

  const archivo = await ArchivoAdjunto.findOne({
    where: { id: archivoId, documentoId: documento.id },
  });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }

  return archivo;
};

// Valida que el responsable pertenezca a la empresa y esté activo
const validarResponsable = async (responsableId, empresaId) => {
  if (!responsableId) return true;
  const emp = await Empleado.findOne({ where: { id: responsableId, empresaId, activo: true } });
  return Boolean(emp);
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

export const notificarDocumentoCargado = async (documento) => {
  const empresa = await Empresa.findByPk(documento.empresaId, {
    include: [{ model: Empleado, as: 'responsableEmpleado' }],
  });
  const responsableEmail = empresa?.responsableEmpleado?.email;
  const adminEmail = process.env.ADMIN_EMAIL;
  const destinatarios = [adminEmail].filter(Boolean);
  if (responsableEmail) destinatarios.push(responsableEmail);

  const cuerpo = buildDocumentoCargado({
    titulo: documento.titulo,
    empresaNombre: empresa?.nombre || 'N/A',
    fechaVencimiento: documento.fechaVencimiento || 'Sin fecha',
  });
  const html = buildEmailTemplate({ title: 'Nuevo documento cargado', message: cuerpo });

  for (const destinatario of destinatarios) {
    const resultado = await enviarCorreoDocumentoCargado({
      destinatario,
      titulo: documento.titulo,
      empresaNombre: empresa?.nombre || 'N/A',
      fechaVencimiento: documento.fechaVencimiento || 'Sin fecha',
      subject: 'Nuevo documento cargado en EcoMinds',
    });

    await NotificacionLog.create({
      tipo: 'documento_cargado',
      referenciaId: documento.id,
      destinatario,
      asunto: 'Nuevo documento cargado en EcoMinds',
      cuerpo: html,
      estado: resultado.success ? 'enviado' : 'fallido',
      error: resultado.error || null,
    });
  }
};