import { addDays, format } from 'date-fns';
import { enviarCorreoRecordatorioAsignacion, enviarCorreoConfirmacionAsignacion } from './emailService.js';
import { buildRecordatorioAsignacion } from '../infrastructure/email/recordatorioAsignacion.js';
import { buildEmailTemplate } from '../../../shared/infrastructure/email/emailService.js';
import db from '../../../models/index.js';

const { EmpresaServicio, Producto, Servicio, Empresa, Empleado, NotificacionLog } = db;

const TIPO_NOTIFICACION = 'servicio_recordatorio';

const calcularFechaReferencia = (asignacion) => {
  const fecha = asignacion.fechaEntrega || asignacion.fechaEjecucion;
  if (!fecha) return null;
  return fecha;
};

const getNombreItem = (asignacion) => {
  if (asignacion.producto) return `Producto: ${asignacion.producto.nombre}`;
  if (asignacion.servicio) return `Servicio: ${asignacion.servicio.nombre}`;
  return 'Producto/Servicio';
};

export const enviarRecordatorioAsignacion = async (asignacion, diasAntes, destinatario) => {
  const fechaReferencia = calcularFechaReferencia(asignacion);
  if (!fechaReferencia) return { skipped: true };

  const yaNotificado = await NotificacionLog.findOne({
    where: {
      tipo: TIPO_NOTIFICACION,
      referenciaId: asignacion.id,
      rangoDias: diasAntes,
      destinatario,
    },
  });
  if (yaNotificado) return { skipped: true };

  const nombreItem = getNombreItem(asignacion);
  const empresaNombre = asignacion.empresa?.nombre || 'Tu empresa';
  const fecha = format(new Date(fechaReferencia), 'dd/MM/yyyy');
  const { titulo, cuerpo } = buildRecordatorioAsignacion({
    nombreItem,
    empresaNombre,
    fecha,
    dias: diasAntes,
  });

  const html = buildEmailTemplate({ title: titulo, message: cuerpo });

  const resultado = await enviarCorreoRecordatorioAsignacion({
    destinatario,
    nombreItem,
    empresaNombre,
    fecha,
    dias: diasAntes,
  });

  await NotificacionLog.create({
    tipo: TIPO_NOTIFICACION,
    referenciaId: asignacion.id,
    rangoDias: diasAntes,
    destinatario,
    asunto: titulo,
    cuerpo: html,
    estado: resultado.success ? 'enviado' : 'fallido',
    error: resultado.error || null,
  });

  return { success: resultado.success, error: resultado.error };
};

export const enviarConfirmacionAsignacion = async (asignacion, destinatarios) => {
  const fechaReferencia = calcularFechaReferencia(asignacion);
  const nombreItem = getNombreItem(asignacion);
  const empresaNombre = asignacion.empresa?.nombre || 'Tu empresa';
  const titulo = 'Asignación confirmada';
  const tipoFecha = asignacion.fechaEntrega ? 'entrega' : 'ejecución';

  for (const destinatario of destinatarios) {
    await enviarCorreoConfirmacionAsignacion({
      destinatario,
      nombreItem,
      empresaNombre,
      fecha: fechaReferencia ? format(new Date(fechaReferencia), 'dd/MM/yyyy') : 'Por definir',
      tipoFecha,
    });
  }
};

export const getDestinatariosAsignacion = async (asignacion) => {
  const empresa = await Empresa.findByPk(asignacion.empresaId, {
    include: [{ model: Empleado, as: 'responsableEmpleado', attributes: ['email'] }],
  });
  const destinatarios = [process.env.ADMIN_EMAIL].filter(Boolean);
  if (empresa?.responsableEmpleado?.email) destinatarios.push(empresa.responsableEmpleado.email);
  return destinatarios;
};

export const buscarAsignacionesParaRecordatorio = async (diasAntes) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaObjetivo = addDays(hoy, diasAntes);
  const fechaStr = format(fechaObjetivo, 'yyyy-MM-dd');

  return EmpresaServicio.findAll({
    where: {
      estado: ['pendiente', 'ejecutado'],
      [db.Sequelize.Op.or]: [
        { fechaEntrega: fechaStr },
        { fechaEjecucion: fechaStr },
      ],
    },
    include: [
      { model: Producto, as: 'producto' },
      { model: Servicio, as: 'servicio' },
      { model: Empresa, as: 'empresa', include: [{ model: Empleado, as: 'responsableEmpleado', attributes: ['email'] }] },
    ],
  });
};