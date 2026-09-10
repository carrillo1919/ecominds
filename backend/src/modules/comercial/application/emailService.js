import { buildEmailTemplate, sendEmail, sendEmailWithTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { buildFacturaEmitida } from '../infrastructure/email/facturaEmitida.js';
import { buildFacturaPagada } from '../infrastructure/email/facturaPagada.js';
import { buildFacturaVencimiento } from '../infrastructure/email/facturaVencimiento.js';

export const enviarCorreoFacturaEmitida = async ({ destinatario, numero, empresaNombre, total, subject, attachments = [] }) =>
  sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: `Factura ${numero}`,
    message: buildFacturaEmitida({ numero, empresaNombre, total }),
    attachments,
  });

export const enviarCorreoFacturaPagada = async ({
  destinatario, numero, empresaNombre, fechaPago, metodoPago, totalPagado, subject, attachments = [],
}) =>
  sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: `Pago recibido: factura ${numero}`,
    message: buildFacturaPagada({ numero, empresaNombre, fechaPago, metodoPago, totalPagado }),
    attachments,
  });

export const enviarCorreoFacturaVencimiento = async ({
  destinatario, numero, empresaNombre, fechaVencimiento, total, dias, subject, attachments = [],
}) => {
  const cuerpo = buildFacturaVencimiento({ numero, empresaNombre, fechaVencimiento, total, dias });
  const html = buildEmailTemplate({ title: 'Recordatorio de vencimiento de factura', message: cuerpo });

  return sendEmail({ to: destinatario, subject, html, attachments });
};
