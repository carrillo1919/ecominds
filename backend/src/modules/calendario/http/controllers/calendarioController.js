import {
  listarEventos,
  crearEvento as crearEventoService,
  actualizarEvento as actualizarEventoService,
  eliminarEvento as eliminarEventoService,
  crearAuditoriaDesdeCalendario,
} from '../../application/calendarioService.js';

// GET /api/calendario/eventos
export const getEventos = async (req, res, next) => {
  try {
    const data = await listarEventos(req);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

// POST /api/calendario/eventos
export const crearEvento = async (req, res, next) => {
  try {
    const evento = await crearEventoService(req);
    return res.status(201).json(evento);
  } catch (error) {
    return next(error);
  }
};

// PUT /api/calendario/eventos/:id
export const actualizarEvento = async (req, res, next) => {
  try {
    const evento = await actualizarEventoService(req.params.id, req);
    return res.json(evento);
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/calendario/eventos/:id
export const eliminarEvento = async (req, res, next) => {
  try {
    await eliminarEventoService(req.params.id, req);
    return res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/calendario/auditorias
export const crearAuditoria = async (req, res, next) => {
  try {
    const auditoria = await crearAuditoriaDesdeCalendario(req);
    return res.status(201).json(auditoria);
  } catch (error) {
    return next(error);
  }
};