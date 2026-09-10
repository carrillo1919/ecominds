import { sendEmailWithTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { buildAuditoriaFinalizada } from '../infrastructure/email/auditoriaFinalizada.js';
import { buildAuditoriaHoy } from '../infrastructure/email/auditoriaHoy.js';

export const enviarCorreoAuditoriaFinalizada = async ({ destinatario, codigo, empresaNombre, fecha, subject }) => {
  const cuerpo = buildAuditoriaFinalizada({ codigo, empresaNombre, fecha });

  return sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: 'Auditoría finalizada',
    message: cuerpo,
  });
};

export const enviarCorreoAuditoriaHoy = async ({ destinatario, codigo, fecha, subject }) => {
  const cuerpo = buildAuditoriaHoy({ codigo, fecha });

  return sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: 'Auditoría programada para hoy',
    message: cuerpo,
  });
};
