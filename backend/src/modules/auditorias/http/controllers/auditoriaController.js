import {
  listarAuditorias,
  obtenerAuditoria,
  crearAuditoria,
  actualizarAuditoria,
  guardarItemsAuditoria,
  finalizarAuditoria,
  eliminarAuditoria,
  obtenerEstadisticas,
  obtenerProximasAuditorias,
} from '../../application/auditoriaService.js';

// GET /api/auditorias
const getAll = async (req, res, next) => {
  try {
    const auditorias = await listarAuditorias(req);
    return res.json({ auditorias });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/:id
const getOne = async (req, res, next) => {
  try {
    const auditoria = await obtenerAuditoria(req.params.id, req);
    return res.json({ auditoria });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auditorias (admin/auditor) - crea la auditoria con el checklist completo
const create = async (req, res, next) => {
  try {
    const auditoria = await crearAuditoria(req);
    return res.status(201).json({ message: 'Auditoria creada', auditoria: auditoria.toJSON() });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/auditorias/:id (cabecera)
const update = async (req, res, next) => {
  try {
    const auditoria = await actualizarAuditoria(req.params.id, req);
    return res.json({ message: 'Auditoria actualizada', auditoria });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/auditorias/:id/items (guarda respuestas del checklist y recalcula)
const saveItems = async (req, res, next) => {
  try {
    const { auditoria, resultado } = await guardarItemsAuditoria(req.params.id, req);
    return res.json({ message: 'Evaluacion guardada', auditoria, resultado });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auditorias/:id/finalizar
const finalizar = async (req, res, next) => {
  try {
    const auditoria = await finalizarAuditoria(req.params.id, req);
    return res.json({ message: 'Auditoria finalizada', auditoria });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/auditorias/:id (solo borradores)
const remove = async (req, res, next) => {
  try {
    await eliminarAuditoria(req.params.id, req);
    return res.json({ message: 'Auditoria eliminada' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/estadisticas (RF-06.2: KPIs por periodo)
const estadisticas = async (req, res, next) => {
  try {
    const data = await obtenerEstadisticas(req);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/proximas?dias=30 (notificaciones de proxima auditoria)
const proximas = async (req, res, next) => {
  try {
    const data = await obtenerProximasAuditorias(req);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export {
  getAll,
  getOne,
  create,
  update,
  saveItems,
  finalizar,
  remove,
  estadisticas,
  proximas,
};