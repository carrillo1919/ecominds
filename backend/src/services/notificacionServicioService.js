import { addDays, format } from 'date-fns';
import { sendEmailWithTemplate, buildEmailTemplate } from './emailService.js';
import db from '../models/index.js';

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
  const titulo = diasAntes === 0
    ? `Recordatorio: ${nombreItem} para hoy`
    : `Recordatorio: ${nombreItem} en ${diasAntes} día(s)`;

  const html = buildEmailTemplate({
    title,
    message: `
      <p>Hola,</p>
      <p>Te recordamos la siguiente entrega/ejecución programada:</p>
      <p><strong>Empresa:</strong> ${empresaNombre}</p>
      <p><strong>${nombreItem}</strong></p>
      <p><strong>Fecha:</strong> ${format(new Date(fechaReferencia), 'dd/MM/yyyy')}</p>
    `,
  });

  const resultado = await sendEmailWithTemplate({
    to: destinatario,
    subject: titulo,
    title,
    message: `
      <p>Hola,</p>
      <p>Te recordamos la siguiente entrega/ejecución programada:</p>
      <p><strong>Empresa:</strong> ${empresaNombre}</p>
      <p><strong>${nombreItem}</strong></p>
      <p><strong>Fecha:</strong> ${format(new Date(fechaReferencia), 'dd/MM/yyyy')}</p>
    `,
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

  for (const destinatario of destinatarios) {
    await sendEmailWithTemplate({
      to: destinatario,
      subject: titulo,
      title: titulo,
      message: `
        <p>Hola,</p>
        <p>Se ha registrado una nueva asignación:</p>
        <p><strong>Empresa:</strong> ${empresaNombre}</p>
        <p><strong>${nombreItem}</strong></p>
        <p><strong>Fecha de ${asignacion.fechaEntrega ? 'entrega' : 'ejecución'}:</strong> ${fechaReferencia ? format(new Date(fechaReferencia), 'dd/MM/yyyy') : 'Por definir'}</p>
      `,
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
