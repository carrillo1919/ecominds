import { Op } from 'sequelize';

import {
  Auditoria,
  AuditoriaItem,
  Requisito,
  Empresa,
  User,
  Empleado,
  sequelize,
} from '../models/index.js';

import {
  calcularResultado,
  nivelPorPorcentaje,
} from '../services/riesgoService.js';

const INCLUDES_BASE = [
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'sector'] },
  { model: User, as: 'auditor', attributes: ['id', 'nombre', 'apellido', 'email', 'rol'] },
];

const INCLUDE_ITEMS = {
  model: AuditoriaItem,
  as: 'items',
  include: [
    { model: Requisito, as: 'requisito' },
    { model: Empleado, as: 'responsableEmpleado', attributes: ['id', 'nombre', 'apellido', 'cargo'] },
  ],
};

const ordenarItems = (auditoria) => {
  const plain = auditoria.toJSON();
  plain.items = (plain.items || []).sort((a, b) => (a.requisito?.orden || 0) - (b.requisito?.orden || 0));
  return plain;
};

// Recalcula y persiste el resultado de la auditoria.
const recalcular = async (auditoriaId, transaction) => {
  const auditoria = await Auditoria.findByPk(auditoriaId, { include: [INCLUDE_ITEMS], transaction });
  if (!auditoria) return null;

  const resultado = calcularResultado(
    auditoria.items.map((i) => ({
      estado: i.estado,
      observaciones: i.observaciones,
      requisito: i.requisito ? i.requisito.toJSON() : null,
    }))
  );

  auditoria.set({
    totalRequisitos: resultado.totalRequisitos,
    totalCumple: resultado.totalCumple,
    totalNoCumple: resultado.totalNoCumple,
    totalNoAplica: resultado.totalNoAplica,
    porcentajeCumplimiento: resultado.porcentajeCumplimiento,
    porcentajeNoCumplimiento: resultado.porcentajeNoCumplimiento,
    nivelRiesgo: resultado.nivelRiesgo,
    riesgoEscalado: resultado.riesgoEscalado,
    resumen: resultado,
  });

  await auditoria.save({ transaction });
  return resultado;
};

// GET /api/auditorias
const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.empresaId) where.empresaId = req.query.empresaId;
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.desde || req.query.hasta) {
      where.fecha = {};
      if (req.query.desde) where.fecha[Op.gte] = req.query.desde;
      if (req.query.hasta) where.fecha[Op.lte] = req.query.hasta;
    }

    const auditorias = await Auditoria.findAll({
      where,
      include: INCLUDES_BASE,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
    });

    return res.json({ auditorias });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/:id
const getOne = async (req, res, next) => {
  try {
    const auditoria = await Auditoria.findByPk(req.params.id, { include: [...INCLUDES_BASE, INCLUDE_ITEMS] });
    if (!auditoria) return res.status(404).json({ message: 'Auditoria no encontrada' });
    return res.json({ auditoria: ordenarItems(auditoria) });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auditorias  (admin/auditor) - crea la auditoria con el checklist completo
const create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { empresaId, fecha, fechaProximaAuditoria, alcance } = req.body;

    const empresa = await Empresa.findByPk(empresaId, { transaction });
    if (!empresa) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const requisitos = await Requisito.findAll({ where: { activo: true }, order: [['orden', 'ASC']], transaction });
    if (!requisitos.length) {
      await transaction.rollback();
      return res.status(409).json({ message: 'No hay requisitos configurados en el checklist' });
    }

    const consecutivo = (await Auditoria.count({ where: { empresaId }, transaction })) + 1;

    const auditoria = await Auditoria.create(
      {
        empresaId,
        auditorId: req.user.id,
        codigo: `AUD-${empresa.rif}-${String(consecutivo).padStart(3, '0')}`,
        fecha: fecha || new Date().toISOString().slice(0, 10),
        fechaProximaAuditoria: fechaProximaAuditoria || null,
        alcance: alcance || null,
        totalRequisitos: requisitos.length,
      },
      { transaction }
    );

    await AuditoriaItem.bulkCreate(
      requisitos.map((r) => ({ auditoriaId: auditoria.id, requisitoId: r.id })),
      { transaction }
    );

    await recalcular(auditoria.id, transaction);
    await transaction.commit();

    const creada = await Auditoria.findByPk(auditoria.id, { include: [...INCLUDES_BASE, INCLUDE_ITEMS] });
    return res.status(201).json({ message: 'Auditoria creada', auditoria: ordenarItems(creada) });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

// PATCH /api/auditorias/:id  (cabecera)
const update = async (req, res, next) => {
  try {
    const auditoria = await Auditoria.findByPk(req.params.id);
    if (!auditoria) return res.status(404).json({ message: 'Auditoria no encontrada' });
    if (auditoria.estado === 'finalizada') {
      return res.status(409).json({ message: 'La auditoria esta finalizada y no puede modificarse' });
    }

    ['fecha', 'fechaProximaAuditoria', 'alcance', 'conclusiones'].forEach((campo) => {
      if (req.body[campo] !== undefined) auditoria[campo] = req.body[campo] || null;
    });

    await auditoria.save();
    return res.json({ message: 'Auditoria actualizada', auditoria });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/auditorias/:id/items  (guarda respuestas del checklist y recalcula)
const saveItems = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const auditoria = await Auditoria.findByPk(req.params.id, { transaction });
    if (!auditoria) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Auditoria no encontrada' });
    }
    if (auditoria.estado === 'finalizada') {
      await transaction.rollback();
      return res.status(409).json({ message: 'La auditoria esta finalizada y no puede modificarse' });
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];

    for (const entrada of items) {
      const item = await AuditoriaItem.findOne({
        where: { id: entrada.id, auditoriaId: auditoria.id },
        transaction,
      });
      if (!item) continue;

      ['estado', 'observaciones', 'accionCorrectiva', 'responsableAccion', 'fechaCompromiso'].forEach((campo) => {
        if (entrada[campo] !== undefined) item[campo] = entrada[campo] || null;
      });

      if (entrada.responsableAccionId !== undefined) {
        if (entrada.responsableAccionId) {
          const emp = await Empleado.findOne({
            where: { id: entrada.responsableAccionId, empresaId: auditoria.empresaId, activo: true },
            transaction,
          });
          if (!emp) {
            await transaction.rollback();
            return res.status(422).json({ message: 'El responsable no es un empleado activo de esta empresa' });
          }
        }
        item.responsableAccionId = entrada.responsableAccionId || null;
      }

      await item.save({ transaction });
    }

    const resultado = await recalcular(auditoria.id, transaction);
    await transaction.commit();

    return res.json({ message: 'Evaluacion guardada', resultado });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

// POST /api/auditorias/:id/finalizar
const finalizar = async (req, res, next) => {
  try {
    const auditoria = await Auditoria.findByPk(req.params.id, { include: [INCLUDE_ITEMS] });
    if (!auditoria) return res.status(404).json({ message: 'Auditoria no encontrada' });
    if (auditoria.estado === 'finalizada') {
      return res.status(409).json({ message: 'La auditoria ya fue finalizada' });
    }

    const sinEvaluar = auditoria.items.filter((i) => !i.estado);
    if (sinEvaluar.length) {
      return res.status(422).json({
        message: `Faltan ${sinEvaluar.length} item(s) por evaluar`,
        pendientes: sinEvaluar.map((i) => i.requisitoId),
      });
    }

    if (req.body.conclusiones !== undefined) auditoria.conclusiones = req.body.conclusiones || null;
    if (req.body.fechaProximaAuditoria !== undefined) {
      auditoria.fechaProximaAuditoria = req.body.fechaProximaAuditoria || null;
    }
    await auditoria.save();

    await recalcular(auditoria.id);

    const finalizada = await Auditoria.findByPk(auditoria.id);
    finalizada.estado = 'finalizada';
    finalizada.finalizadaEn = new Date();
    await finalizada.save();

    const completa = await Auditoria.findByPk(auditoria.id, { include: [...INCLUDES_BASE, INCLUDE_ITEMS] });
    return res.json({ message: 'Auditoria finalizada', auditoria: ordenarItems(completa) });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/auditorias/:id  (solo borradores)
const remove = async (req, res, next) => {
  try {
    const auditoria = await Auditoria.findByPk(req.params.id);
    if (!auditoria) return res.status(404).json({ message: 'Auditoria no encontrada' });
    if (auditoria.estado === 'finalizada') {
      return res.status(409).json({ message: 'No se puede eliminar una auditoria finalizada' });
    }

    await auditoria.destroy();
    return res.json({ message: 'Auditoria eliminada' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/estadisticas  (RF-06.2: KPIs por periodo)
const estadisticas = async (req, res, next) => {
  try {
    const where = { estado: 'finalizada' };
    if (req.query.empresaId) where.empresaId = req.query.empresaId;
    if (req.query.desde || req.query.hasta) {
      where.fecha = {};
      if (req.query.desde) where.fecha[Op.gte] = req.query.desde;
      if (req.query.hasta) where.fecha[Op.lte] = req.query.hasta;
    }

    const auditorias = await Auditoria.findAll({ where, include: INCLUDES_BASE, order: [['fecha', 'ASC']] });

    const total = auditorias.length;
    const promedio = (campo) =>
      total ? Math.round((auditorias.reduce((acc, a) => acc + Number(a[campo] || 0), 0) / total) * 100) / 100 : 0;

    const promedioNoCumplimiento = promedio('porcentajeNoCumplimiento');

    const distribucionRiesgo = { BAJO: 0, MEDIO: 0, ALTO: 0 };
    auditorias.forEach((a) => {
      distribucionRiesgo[a.nivelRiesgo] += 1;
    });

    // Consolidado por bloque legal a partir del resumen almacenado.
    const bloquesMap = new Map();
    auditorias.forEach((a) => {
      (a.resumen?.bloques || []).forEach((b) => {
        if (!bloquesMap.has(b.bloque)) {
          bloquesMap.set(b.bloque, { bloque: b.bloque, total: 0, cumple: 0, noCumple: 0, noAplica: 0 });
        }
        const acc = bloquesMap.get(b.bloque);
        acc.total += b.total;
        acc.cumple += b.cumple;
        acc.noCumple += b.noCumple;
        acc.noAplica += b.noAplica;
      });
    });

    const bloques = [...bloquesMap.values()].map((b) => {
      const aplicables = b.total - b.noAplica;
      const pct = aplicables > 0 ? Math.round((b.noCumple / aplicables) * 10000) / 100 : 0;
      return {
        ...b,
        aplicables,
        porcentajeNoCumplimiento: pct,
        porcentajeCumplimiento: aplicables > 0 ? Math.round((b.cumple / aplicables) * 10000) / 100 : 0,
        nivelRiesgo: nivelPorPorcentaje(pct),
      };
    });

    // Requisitos con mayor incumplimiento en el periodo.
    const reincidentesMap = new Map();
    auditorias.forEach((a) => {
      (a.resumen?.hallazgosCriticos || []).forEach((h) => {
        const acc = reincidentesMap.get(h.codigo) || { ...h, veces: 0 };
        acc.veces += 1;
        reincidentesMap.set(h.codigo, acc);
      });
    });

    const tendencia = auditorias.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      empresa: a.empresa?.nombre,
      porcentajeCumplimiento: Number(a.porcentajeCumplimiento),
      porcentajeNoCumplimiento: Number(a.porcentajeNoCumplimiento),
      nivelRiesgo: a.nivelRiesgo,
    }));

    return res.json({
      periodo: { desde: req.query.desde || null, hasta: req.query.hasta || null },
      totalAuditorias: total,
      promedioCumplimiento: promedio('porcentajeCumplimiento'),
      promedioNoCumplimiento,
      nivelRiesgoPromedio: nivelPorPorcentaje(promedioNoCumplimiento),
      distribucionRiesgo,
      bloques,
      hallazgosCriticosRecurrentes: [...reincidentesMap.values()].sort((a, b) => b.veces - a.veces),
      tendencia,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auditorias/proximas?dias=30  (notificaciones de proxima auditoria)
const proximas = async (req, res, next) => {
  try {
    const dias = Number(req.query.dias || 30);
    const hoy = new Date();
    const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);

    const auditorias = await Auditoria.findAll({
      where: {
        fechaProximaAuditoria: { [Op.ne]: null, [Op.lte]: limite.toISOString().slice(0, 10) },
      },
      include: INCLUDES_BASE,
      order: [['fechaProximaAuditoria', 'ASC']],
    });

    const hoyStr = hoy.toISOString().slice(0, 10);

    return res.json({
      dias,
      alertas: auditorias.map((a) => {
        const dif = Math.ceil(
          (new Date(a.fechaProximaAuditoria).getTime() - new Date(hoyStr).getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          auditoriaId: a.id,
          empresa: a.empresa,
          ultimaFecha: a.fecha,
          fechaProximaAuditoria: a.fechaProximaAuditoria,
          diasRestantes: dif,
          vencida: dif < 0,
          nivelRiesgo: a.nivelRiesgo,
        };
      }),
    });
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
  recalcular,
};
