import cron from 'node-cron';
import { Op } from 'sequelize';
import { addDays, format } from 'date-fns';
import { buildEmailTemplate, sendEmail } from '../services/emailService.js';
import { Empresa, Empleado, Factura, NotificacionLog } from '../models/index.js';
import logger from '../utils/logger.js';

const RANGOS_DIAS = [15, 3, 0];

const mensajeRecordatorio = (factura, dias) => {
  const encabezado = dias === 0
    ? 'La siguiente factura vence hoy:'
    : 'La siguiente factura está próxima a vencer:';
  return `
    <p>${encabezado}</p>
    <p><strong>Factura:</strong> ${factura.numero}</p>
    <p><strong>Empresa:</strong> ${factura.empresa?.nombre || 'No disponible'}</p>
    <p><strong>Fecha de vencimiento:</strong> ${factura.fechaVencimiento}</p>
    <p><strong>Total pendiente:</strong> ${Number(factura.total || 0).toFixed(2)}</p>
    <p>${dias === 0 ? 'Por favor, gestione el pago hoy.' : `Faltan ${dias} días para su vencimiento.`}</p>
  `;
};

export const runFacturasVencimientoJob = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let enviados = 0;

  for (const dias of RANGOS_DIAS) {
    const fechaVencimiento = format(addDays(hoy, dias), 'yyyy-MM-dd');
    const facturas = await Factura.findAll({
      where: { estado: 'emitida', fechaVencimiento: { [Op.eq]: fechaVencimiento } },
      include: [{
        model: Empresa,
        as: 'empresa',
        include: [{ model: Empleado, as: 'responsableEmpleado', attributes: ['email'] }],
      }],
    });

    for (const factura of facturas) {
      const destinatarios = [...new Set([
        factura.empresa?.responsableEmpleado?.email || factura.empresa?.email,
        process.env.ADMIN_EMAIL,
      ].filter(Boolean))];
      const asunto = dias === 0
        ? `Factura ${factura.numero} vence hoy`
        : `Recordatorio: factura ${factura.numero} vence en ${dias} días`;
      const cuerpo = mensajeRecordatorio(factura, dias);
      const html = buildEmailTemplate({ title: 'Recordatorio de vencimiento de factura', message: cuerpo });
      const attachments = factura.pdfContenido ? [{
        filename: factura.pdfNombreArchivo || `factura-${factura.numero}.pdf`,
        content: factura.pdfContenido,
        contentType: 'application/pdf',
      }] : [];

      for (const destinatario of destinatarios) {
        const yaNotificado = await NotificacionLog.findOne({
          where: { tipo: 'factura_vencimiento', referenciaId: factura.id, rangoDias: dias, destinatario },
        });
        if (yaNotificado) continue;

        const resultado = await sendEmail({ to: destinatario, subject: asunto, html, attachments });
        await NotificacionLog.create({
          tipo: 'factura_vencimiento',
          referenciaId: factura.id,
          rangoDias: dias,
          destinatario,
          asunto,
          cuerpo: html,
          estado: resultado.success ? 'enviado' : 'fallido',
          error: resultado.error || null,
        });
        if (resultado.success) enviados += 1;
      }
    }
  }

  return { enviados, tipo: 'factura_vencimiento' };
};

const facturasVencimientoJob = () => {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[cron] Ejecutando job de vencimientos de facturas...');
    try {
      const resultado = await runFacturasVencimientoJob();
      logger.info({ event: 'job_facturas_vencimiento_completed', enviados: resultado.enviados });
    } catch (error) {
      logger.error({ event: 'job_facturas_vencimiento_error', error: error.message, stack: error.stack });
    }
  });
};

export default facturasVencimientoJob;