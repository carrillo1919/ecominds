import cron from 'node-cron';
import { Op } from 'sequelize';
import { addDays, format } from 'date-fns';
import { enviarCorreoFacturaVencimiento } from '../application/emailService.js';
import { buildFacturaVencimiento } from '../infrastructure/email/facturaVencimiento.js';
import { buildEmailTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { Empresa, Empleado, Factura, NotificacionLog } from '../../../models/index.js';
import logger from '../../../shared/observability/logger.js';

const RANGOS_DIAS = [15, 3, 0];

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
      const fechaVencimiento = factura.fechaVencimiento;
      const total = Number(factura.total || 0).toFixed(2);
      const html = buildEmailTemplate({
        title: 'Recordatorio de vencimiento de factura',
        message: buildFacturaVencimiento({
          numero: factura.numero,
          empresaNombre: factura.empresa?.nombre || 'No disponible',
          fechaVencimiento,
          total,
          dias,
        }),
      });
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

        const resultado = await enviarCorreoFacturaVencimiento({
          destinatario,
          numero: factura.numero,
          empresaNombre: factura.empresa?.nombre || 'No disponible',
          fechaVencimiento,
          total,
          dias,
          subject: asunto,
          attachments,
        });
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