import { sendEmailWithTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { buildDocumentoCargado } from '../infrastructure/email/documentoCargado.js';
import { buildDocumentoVencimiento } from '../infrastructure/email/documentoVencimiento.js';

export const enviarCorreoDocumentoCargado = async ({ destinatario, titulo, empresaNombre, fechaVencimiento, subject }) => {
  const cuerpo = buildDocumentoCargado({ titulo, empresaNombre, fechaVencimiento });

  return sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: 'Nuevo documento cargado',
    message: cuerpo,
  });
};

export const enviarCorreoDocumentoVencimiento = async ({ destinatario, titulo, fechaVencimiento, subject }) => {
  const cuerpo = buildDocumentoVencimiento({ titulo, fechaVencimiento });

  return sendEmailWithTemplate({
    to: destinatario,
    subject,
    title: 'Recordatorio de vencimiento',
    message: cuerpo,
  });
};
