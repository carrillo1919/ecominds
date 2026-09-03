import cron from 'node-cron';
import { Op } from 'sequelize';
import { addDays, format } from 'date-fns';
import { sendEmailWithTemplate } from '../services/emailService.js';
import { Documento, Empresa, Empleado, NotificacionConfig, NotificacionLog } from '../models/index.js';

export const runDocumentosVencimientoJob = async () => {
  const config = await NotificacionConfig.findOne({ where: { tipo: 'documento_vencimiento', activo: true } });
  if (!config) {
    console.log('[job:vencimientos] No hay configuración activa');
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

        const html = buildEmailTemplate({
          title: 'Recordatorio de vencimiento',
          message: `
            <p>El siguiente documento está próximo a vencer:</p>
            <p><strong>Documento:</strong> ${documento.titulo}</p>
            <p><strong>Fecha de vencimiento:</strong> ${format(new Date(documento.fechaVencimiento), 'dd/MM/yyyy')}</p>
            <p>Por favor, actualiza o renueva el documento antes de la fecha límite.</p>
          `,
        });

        const resultado = await sendEmailWithTemplate({
          to: destinatario,
          subject: config.plantillaAsunto || 'Recordatorio de vencimiento',
          title: 'Recordatorio de vencimiento',
          message: `
            <p>El siguiente documento está próximo a vencer:</p>
            <p><strong>Documento:</strong> ${documento.titulo}</p>
            <p><strong>Fecha de vencimiento:</strong> ${format(new Date(documento.fechaVencimiento), 'dd/MM/yyyy')}</p>
            <p>Por favor, actualiza o renueva el documento antes de la fecha límite.</p>
          `,
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
    console.log('[cron] Ejecutando job de vencimientos...');
    try {
      const resultado = await runDocumentosVencimientoJob();
      console.log('[cron] Vencimientos enviados:', resultado.enviados);
    } catch (error) {
      console.error('[cron] Error en job de vencimientos:', error);
    }
  });
};

export default documentosVencimientoJob;