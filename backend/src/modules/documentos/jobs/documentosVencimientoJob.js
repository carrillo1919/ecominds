import cron from 'node-cron';
import { Op } from 'sequelize';
import { addDays, format } from 'date-fns';
import { enviarCorreoDocumentoVencimiento } from '../application/emailService.js';
import { buildDocumentoVencimiento } from '../infrastructure/email/documentoVencimiento.js';
import { buildEmailTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { Documento, Empresa, Empleado, NotificacionConfig, NotificacionLog } from '../../../models/index.js';
import logger from '../../../shared/observability/logger.js';

export const runDocumentosVencimientoJob = async () => {
  const config = await NotificacionConfig.findOne({ where: { tipo: 'documento_vencimiento', activo: true } });
  if (!config) {
    logger.info('[job:vencimientos] No hay configuración activa');
    return { enviados: 0, tipo: 'documento_vencimiento' };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let enviados = 0;

  for (const dias of config.rangosDias) {
    const fechaReferencia = addDays(hoy, dias);
    const fechaInicio = format(fechaReferencia, 'yyyy-MM-dd');
    const fechaFin = fechaInicio;

    const documentos = await Documento.findAll({
      where: { fechaVencimiento: { [Op.between]: [fechaInicio, fechaFin] } },
      include: [
        {
          model: Empresa,
          as: 'empresa',
          include: [{ model: Empleado, as: 'responsableEmpleado', attributes: ['id', 'nombre', 'email'] }],
        },
      ],
    });

    for (const documento of documentos) {
      const responsableEmail = documento.empresa?.responsableEmpleado?.email;
      const adminEmail = process.env.ADMIN_EMAIL;
      const destinatarios = [adminEmail].filter(Boolean);
      if (responsableEmail) destinatarios.push(responsableEmail);

      for (const destinatario of destinatarios) {
        const yaNotificado = await NotificacionLog.findOne({
          where: {
            tipo: 'documento_vencimiento',
            referenciaId: documento.id,
            rangoDias: dias,
            destinatario,
          },
        });
        if (yaNotificado) continue;

        const fechaVencimiento = format(new Date(documento.fechaVencimiento), 'dd/MM/yyyy');
        const html = buildEmailTemplate({
          title: 'Recordatorio de vencimiento',
          message: buildDocumentoVencimiento({ titulo: documento.titulo, fechaVencimiento }),
        });

        const resultado = await enviarCorreoDocumentoVencimiento({
          destinatario,
          titulo: documento.titulo,
          fechaVencimiento,
          subject: config.plantillaAsunto || 'Recordatorio de vencimiento',
        });

        await NotificacionLog.create({
          tipo: 'documento_vencimiento',
          referenciaId: documento.id,
          rangoDias: dias,
          destinatario,
          asunto: config.plantillaAsunto || 'Recordatorio de vencimiento',
          cuerpo: html,
          estado: resultado.success ? 'enviado' : 'fallido',
          error: resultado.error || null,
        });

        if (resultado.success) enviados += 1;
      }
    }
  }

  return { enviados, tipo: 'documento_vencimiento' };
};

const documentosVencimientoJob = () => {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[cron] Ejecutando job de vencimientos...');
    try {
      const resultado = await runDocumentosVencimientoJob();
      logger.info({ event: 'job_vencimientos_completed', enviados: resultado.enviados });
    } catch (error) {
      logger.error({ event: 'job_vencimientos_error', error: error.message, stack: error.stack });
    }
  });
};

export default documentosVencimientoJob;