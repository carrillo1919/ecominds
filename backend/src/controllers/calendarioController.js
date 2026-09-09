import { Op } from 'sequelize';
import db from '../models/index.js';
import { applyEmpresaScope, assertEmpresaInScope } from '../utils/empresaScope.js';

const COLORES = {
  auditoria: '#ef4444',
  documentoEmision: '#3b82f6',
  documentoVencimiento: '#8b5cf6',
  compromiso: '#f59e0b',
  nota: '#10b981',
  servicio: '#8b5cf6',
  producto: '#0ea5e9',
};

const tieneAccesoTotal = (req) => Boolean(req.scope?.all);

const validarFecha = (fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha);

const obtenerUsuarioId = (req) => req.user?.id ?? req.userId ?? null;

const obtenerRango = (req) => {
  const { fechaInicio, fechaFin } = req.query;

  if (fechaInicio || fechaFin) {
    if (!fechaInicio || !fechaFin || !validarFecha(fechaInicio) || !validarFecha(fechaFin)) {
      return { error: 'fechaInicio y fechaFin son obligatorias con formato YYYY-MM-DD' };
    }
    return { fechaInicio, fechaFin };
  }

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  return {
    fechaInicio: `${anio}-${String(mes + 1).padStart(2, '0')}-01`,
    fechaFin: `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
  };
};

// GET /api/calendario/eventos
export const getEventos = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, error } = obtenerRango(req);
    if (error) return res.status(400).json({ message: error });

    const rango = { [Op.between]: [fechaInicio, fechaFin] };
    const usuarioId = obtenerUsuarioId(req);

    // Notas: públicas SIEMPRE visibles, privadas solo del creador
    const whereNotas = {
      fecha: rango,
      [Op.or]: [
        { privacidad: 'publico' },
        { privacidad: 'privado', usuarioId },
      ],
    };

    if (!tieneAccesoTotal(req)) {
      const empresaIds = req.scope?.empresaIds || [];
      whereNotas[Op.and] = empresaIds.length
        ? [{ [Op.or]: [{ empresaId: null }, { empresaId: empresaIds }] }]
        : [{ empresaId: null }];
    }

    const [auditorias, documentos, auditoriaItems, empresaServicios, calendarioEventos] = await Promise.all([
      db.Auditoria.findAll({
        where: applyEmpresaScope({ fecha: rango }, req),
        include: [{ model: db.Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }],
      }),
      db.Documento.findAll({
        where: applyEmpresaScope({ [Op.or]: [{ fecha_documento: rango }, { fecha_vencimiento: rango }] }, req),
        include: [{ model: db.Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }],
      }),
      db.AuditoriaItem.findAll({
        where: { fechaCompromiso: rango },
        include: [
          {
            model: db.Auditoria,
            as: 'auditoria',
            where: applyEmpresaScope({}, req),
            required: true,
            include: [{ model: db.Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] }],
          },
          { model: db.Requisito, as: 'requisito' },
        ],
      }),
      db.EmpresaServicio.findAll({
        where: applyEmpresaScope({
          estado: { [Op.not]: 'cancelado' },
          [Op.or]: [{ fechaEjecucion: rango }, { fechaEntrega: rango }],
        }, req),
        include: [
          { model: db.Producto, as: 'producto' },
          { model: db.Servicio, as: 'servicio' },
          { model: db.Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
        ],
      }),
      db.CalendarioEvento.findAll({
        where: whereNotas,
        include: [
          { model: db.Auditoria, as: 'auditoria' },
          { model: db.Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif'] },
        ],
      }),
    ]);

    const eventos = [];

    // Auditorías existentes
    for (const a of auditorias) {
      eventos.push({
        id: `auditoria-${a.id}`,
        titulo: a.titulo || `Auditoría ${a.tipo || ''}`.trim(),
        empresa: a.empresa?.nombre || null,
        fecha: a.fecha,
        tipo: 'auditoria',
        origen: 'auditoria',
        entidadId: a.id,
        auditoriaId: a.id,
        color: COLORES.auditoria,
        descripcion: a.titulo || `Auditoría ${a.tipo || ''}`.trim(),
      });
    }

    // Documentos: fecha de emisión y fecha de vencimiento
    for (const d of documentos) {
      const tituloDoc = d.titulo || d.nombre || 'Documento';
      const empresaDoc = d.empresa?.nombre || null;

      if (d.fechaDocumento) {
        eventos.push({
          id: `doc-emision-${d.id}`,
          titulo: `Emisión: ${tituloDoc}`,
          empresa: empresaDoc,
          fecha: d.fechaDocumento,
          tipo: 'documento',
          subtipo: 'documento_emision',
          origen: 'documento',
          entidadId: d.id,
          documentoId: d.id,
          color: COLORES.documentoEmision,
          descripcion: tituloDoc,
        });
      }

      if (d.fechaVencimiento) {
        eventos.push({
          id: `doc-vencimiento-${d.id}`,
          titulo: `Vence: ${tituloDoc}`,
          empresa: empresaDoc,
          fecha: d.fechaVencimiento,
          tipo: 'documento',
          subtipo: 'documento_vencimiento',
          origen: 'documento',
          entidadId: d.id,
          documentoId: d.id,
          color: COLORES.documentoVencimiento,
          descripcion: tituloDoc,
        });
      }
    }

    // Compromisos del checklist de auditoría
    for (const item of auditoriaItems) {
      eventos.push({
        id: `compromiso-${item.id}`,
        titulo: item.accionCorrectiva || item.requisito?.descripcion || 'Compromiso de auditoría',
        empresa: item.auditoria?.empresa?.nombre || null,
        fecha: item.fechaCompromiso,
        tipo: 'compromiso',
        origen: 'auditoriaItem',
        entidadId: item.id,
        auditoriaId: item.auditoriaId,
        auditoriaItemId: item.id,
        color: COLORES.compromiso,
        descripcion: `Auditoría: ${item.auditoria?.titulo || ''}`.trim(),
      });
    }

    // Asignaciones de productos/servicios
    for (const asignacion of empresaServicios) {
      const fecha = asignacion.fechaEntrega || asignacion.fechaEjecucion;
      const tipo = asignacion.productoId ? 'producto' : 'servicio';
      const nombre = asignacion.producto?.nombre || asignacion.servicio?.nombre || (tipo === 'producto' ? 'Producto' : 'Servicio');
      const titulo = tipo === 'producto' ? `Entrega: ${nombre}` : `Ejecución: ${nombre}`;

      eventos.push({
        id: `empresa-servicio-${asignacion.id}`,
        titulo,
        empresa: asignacion.empresa?.nombre || null,
        fecha,
        tipo,
        origen: 'empresaServicio',
        entidadId: asignacion.id,
        empresaServicioId: asignacion.id,
        color: COLORES[tipo],
        descripcion: `Asignación para ${asignacion.empresa?.nombre || ''}`.trim(),
      });
    }

    // Notas y auditorías planificadas desde CalendarioEvento
    for (const evento of calendarioEventos) {
      if (evento.auditoriaId || evento.documentoId || evento.auditoriaItemId || evento.empresaServicioId) continue;

      eventos.push({
        id: evento.id,
        titulo: evento.titulo,
        fecha: evento.fecha,
        tipo: evento.tipo === 'auditoria' ? 'auditoria' : 'nota',
        origen: 'calendario',
        entidadId: evento.id,
        color: evento.color || COLORES.nota,
        descripcion: evento.descripcion,
        empresa: evento.empresa?.nombre || null,
        empresaId: evento.empresaId || null,
        usuarioId: evento.usuarioId,
        privacidad: evento.privacidad,
        esMio: evento.usuarioId === usuarioId,
      });
    }

    eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

    res.json({ fechaInicio, fechaFin, total: eventos.length, eventos });
  } catch (error) {
    next(error);
  }
};

// POST /api/calendario/eventos
export const crearEvento = async (req, res, next) => {
  try {
    const { titulo, descripcion, fecha, tipo, color, auditoriaId, privacidad, empresaId } = req.body;

    if (!titulo || !fecha || !validarFecha(fecha)) {
      return res.status(400).json({ message: 'titulo y fecha son obligatorios. fecha debe ser YYYY-MM-DD' });
    }

    const tipoEvento = tipo || 'nota';
    if (!db.CalendarioEvento.TIPOS.includes(tipoEvento)) {
      return res.status(400).json({ message: `tipo debe ser uno de: ${db.CalendarioEvento.TIPOS.join(', ')}` });
    }

    if (empresaId) {
      assertEmpresaInScope(empresaId, req);
    }

    if (auditoriaId) {
      const auditoria = await db.Auditoria.findByPk(auditoriaId);
      if (!auditoria) return res.status(404).json({ message: 'Auditoría no encontrada' });
      assertEmpresaInScope(auditoria.empresaId, req);
    }

    if (['servicio', 'producto'].includes(tipoEvento)) {
      return res.status(400).json({ message: 'Las asignaciones de servicios/productos se crean desde el módulo de asignaciones' });
    }

    const evento = await db.CalendarioEvento.create({
      titulo,
      descripcion,
      fecha,
      tipo: tipoEvento,
      color,
      auditoriaId: auditoriaId || null,
      usuarioId: obtenerUsuarioId(req),
      privacidad: privacidad === 'privado' ? 'privado' : 'publico',
      empresaId: empresaId || null,
    });

    res.status(201).json(evento.get({ plain: true }));
  } catch (error) {
    next(error);
  }
};

// PUT /api/calendario/eventos/:id
export const actualizarEvento = async (req, res, next) => {
  try {
    const evento = await db.CalendarioEvento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ message: 'Evento no encontrado' });
    if (evento.empresaId) {
      assertEmpresaInScope(evento.empresaId, req);
    }

    const usuarioId = obtenerUsuarioId(req);
    if (evento.usuarioId && usuarioId && evento.usuarioId !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para editar este evento' });
    }

    const dataActualizada = {};
    if (req.body.titulo !== undefined) dataActualizada.titulo = req.body.titulo;
    if (req.body.descripcion !== undefined) dataActualizada.descripcion = req.body.descripcion;
    if (req.body.fecha !== undefined) dataActualizada.fecha = req.body.fecha;
    if (req.body.tipo !== undefined) dataActualizada.tipo = req.body.tipo;
    if (req.body.color !== undefined) dataActualizada.color = req.body.color;
    if (req.body.privacidad !== undefined) dataActualizada.privacidad = req.body.privacidad === 'privado' ? 'privado' : 'publico';
    if (req.body.empresaId !== undefined) {
      if (req.body.empresaId) {
        assertEmpresaInScope(req.body.empresaId, req);
      }
      dataActualizada.empresaId = req.body.empresaId || null;
    }

    await evento.update(dataActualizada);
    res.json(evento.get({ plain: true }));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/calendario/eventos/:id
export const eliminarEvento = async (req, res, next) => {
  try {
    const evento = await db.CalendarioEvento.findByPk(req.params.id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    if (evento.empresaId) {
      assertEmpresaInScope(evento.empresaId, req);
    }

    const usuarioId = obtenerUsuarioId(req);
    if (evento.usuarioId && usuarioId && evento.usuarioId !== usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });
    }

    await evento.destroy();
    res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// POST /api/calendario/auditorias
// Crea una auditoría real en la fecha seleccionada y la enlaza como evento de calendario.
export const crearAuditoria = async (req, res, next) => {
  try {
    const { fecha, tipo, titulo, descripcion, estado } = req.body;
    const empresaId = req.body.empresaId ?? req.empresaId;
    const auditorId = req.user?.id ?? req.userId;

    if (!fecha || !validarFecha(fecha)) {
      return res.status(400).json({ message: 'fecha es obligatoria con formato YYYY-MM-DD' });
    }

    if (!empresaId) {
      return res.status(400).json({ message: 'empresaId es obligatorio para crear una auditoría' });
    }
    assertEmpresaInScope(empresaId, req);

    if (!auditorId) {
      return res.status(401).json({ message: 'No se pudo identificar al usuario autenticado' });
    }

    const dataAuditoria = {
      fecha,
      empresaId,
      auditorId,
    };
    if (tipo) dataAuditoria.tipo = tipo;
    if (titulo) dataAuditoria.titulo = titulo;
    if (descripcion) dataAuditoria.descripcion = descripcion;
    if (estado) dataAuditoria.estado = estado;

    const auditoria = await db.Auditoria.create(dataAuditoria);

    // Registro en el calendario para tener trazabilidad del origen.
    await db.CalendarioEvento.create({
      titulo: titulo || `Auditoría del ${fecha}`,
      descripcion,
      fecha,
      tipo: 'auditoria',
      auditoriaId: auditoria.id,
      usuarioId: obtenerUsuarioId(req),
      color: COLORES.auditoria,
    });

    res.status(201).json(auditoria.get({ plain: true }));
  } catch (error) {
    next(error);
  }
};