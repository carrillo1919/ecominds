import cron from 'node-cron';
import { Op } from 'sequelize';
import { format } from 'date-fns';
import { enviarCorreoAuditoriaHoy } from '../application/emailService.js';
import { buildAuditoriaHoy } from '../infrastructure/email/auditoriaHoy.js';
import { buildEmailTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { Auditoria, Empresa, Empleado, NotificacionConfig, NotificacionLog } from '../../../models/index.js';
import logger from '../../../shared/observability/logger.js';

export const runAuditoriaHoyJob = async () => {
  const config = await NotificacionConfig.findOne({ where: { tipo: 'auditoria', activo: true } });
  if (!config) {
    logger.info('[job:auditorias] No hay configuración activa');
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

      const codigo = auditoria.codigo || `Auditoría #${auditoria.id}`;
      const fecha = format(new Date(auditoria.fecha), 'dd/MM/yyyy');
      const html = buildEmailTemplate({
        title: 'Auditoría programada para hoy',
        message: buildAuditoriaHoy({ codigo, fecha }),
      });

      const resultado = await enviarCorreoAuditoriaHoy({
        destinatario,
        codigo,
        fecha,
        subject: config.plantillaAsunto || 'Auditoría programada',
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
    logger.info('[cron] Ejecutando job de auditorías...');
    try {
      const resultado = await runAuditoriaHoyJob();
      logger.info({ event: 'job_auditorias_completed', enviados: resultado.enviados });
    } catch (error) {
      logger.error({ event: 'job_auditorias_error', error: error.message, stack: error.stack });
    }
  });
};

export default auditoriaHoyJob;