import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../../observability/logger.js';
import { buildLayout } from './layout.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV !== 'development',
  },
  family: 4,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ICONO_LOCAL = path.join(__dirname, 'assets', 'icono_hoja.png');

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ event: 'email_send_failed', message: 'Error enviando correo', error: error.message, subject });
    return { success: false, error: error.message };
  }
};

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    logger.info('[email] Conexión SMTP verificada');
  } catch (error) {
    logger.error({ event: 'email_verify_failed', message: '[email] No se pudo verificar la conexión SMTP', error: error.message });
  }
};

const getLogoAttachment = () => {
  if (!fs.existsSync(ICONO_LOCAL)) {
    logger.warn(`[email] Icono no encontrado en ${ICONO_LOCAL}`);
    return null;
  }

  return {
    filename: 'icono_hoja.png',
    path: ICONO_LOCAL,
    cid: 'ecominds-logo',
  };
};

export const buildEmailTemplate = ({ title, message, actionUrl = null, actionText = null }) =>
  buildLayout({ title, message, actionUrl, actionText });

export const sendEmailWithTemplate = async ({ to, subject, title, message, actionUrl, actionText, attachments = [] }) => {
  const html = buildEmailTemplate({ title, message, actionUrl, actionText });
  const attachment = getLogoAttachment();
  const allAttachments = attachment ? [attachment, ...attachments] : attachments;

  const result = await sendEmail({ to, subject, html, attachments: allAttachments });
  if (!result.success) throw new Error(result.error);
  return result;
};
