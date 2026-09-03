import cron from 'node-cron';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import { sendEmailWithTemplate } from '../services/emailService.js';
import { Auditoria, Empresa, Empleado, NotificacionConfig, NotificacionLog } from '../models/index.js';

export const runAuditoriaHoyJob = async () => {
  const config = await NotificacionConfig.findOne({ where: { tipo: 'auditoria', activo: true } });
  if (!config) {
    console.log('[job:auditorias] No hay configuración activa');
    return { enviados: 0, tipo: 'auditoria' };
  }

  const hoy = new Date().toISOString().slice(0, 10);
  let enviados = 0;

  const auditorias = await Auditoria.findAll({
    where: { fecha: { [Op.eq]: hoy } },
    include: [
      {
        model: Empresa,
        as: 'empresa',
        include: [{ model: Empleado, as: 'responsableEmpleado', attributes: ['id', 'nombre', 'email'] }],
      },
    ],
  });

  for (const auditoria of auditorias) {
    const responsableEmail = auditoria.empresa?.responsableEmpleado?.email;
    const adminEmail = process.env.ADMIN_EMAIL;
    const destinatarios = [adminEmail].filter(Boolean);
    if (responsableEmail) destinatarios.push(responsableEmail);

    for (const destinatario of destinatarios) {
      const yaNotificado = await NotificacionLog.findOne({
        where: { tipo: 'auditoria', referenciaId: auditoria.id, destinatario },
      });
      if (yaNotificado) continue;

      const html = buildEmailTemplate({
        title: 'Auditoría programada para hoy',
        message: `
          <p>Tienes una auditoría programada para el día de hoy:</p>
          <p><strong>Código:</strong> ${auditoria.codigo || `Auditoría #${auditoria.id}`}</p>
          <p><strong>Fecha:</strong> ${format(new Date(auditoria.fecha), 'dd/MM/yyyy')}</p>
        `,
      });

      const resultado = await sendEmailWithTemplate({
        to: destinatario,
        subject: config.plantillaAsunto || 'Auditoría programada',
        title: 'Auditoría programada para hoy',
        message: `
          <p>Tienes una auditoría programada para el día de hoy:</p>
          <p><strong>Código:</strong> ${auditoria.codigo || `Auditoría #${auditoria.id}`}</p>
          <p><strong>Fecha:</strong> ${format(new Date(auditoria.fecha), 'dd/MM/yyyy')}</p>
        `,
      });

      await NotificacionLog.create({
        tipo: 'auditoria',
        referenciaId: auditoria.id,
        destinatario,
        asunto: config.plantillaAsunto || 'Auditoría programada',
        cuerpo: html,
        estado: resultado.success ? 'enviado' : 'fallido',
        error: resultado.error || null,
      });

      if (resultado.success) enviados += 1;
    }
  }

  return { enviados, tipo: 'auditoria' };
};

const auditoriaHoyJob = () => {
  cron.schedule('0 7 * * *', async () => {
    console.log('[cron] Ejecutando job de auditorías...');
    try {
      const resultado = await runAuditoriaHoyJob();
      console.log('[cron] Auditorías enviadas:', resultado.enviados);
    } catch (error) {
      console.error('[cron] Error en job de auditorías:', error);
    }
  });
};

export default auditoriaHoyJob;