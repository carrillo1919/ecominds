import { sendEmailWithTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { buildRecordatorioAsignacion } from '../infrastructure/email/recordatorioAsignacion.js';
import { buildConfirmacionAsignacion } from '../infrastructure/email/confirmacionAsignacion.js';

export const enviarCorreoRecordatorioAsignacion = async ({
  destinatario, nombreItem, empresaNombre, fecha, dias,
}) => {
  const { titulo, cuerpo } = buildRecordatorioAsignacion({ nombreItem, empresaNombre, fecha, dias });

  return sendEmailWithTemplate({
    to: destinatario,
    subject: titulo,
    title: titulo,
    message: cuerpo,
  });
};

export const enviarCorreoConfirmacionAsignacion = async ({
  destinatario, nombreItem, empresaNombre, fecha, tipoFecha,
}) =>
  sendEmailWithTemplate({
    to: destinatario,
    subject: 'Asignación confirmada',
    title: 'Asignación confirmada',
    message: buildConfirmacionAsignacion({ nombreItem, empresaNombre, fecha, tipoFecha }),
  });
