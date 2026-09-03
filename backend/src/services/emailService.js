import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const frontendUrl = process.env.EMAIL_FRONTEND_URL ||
  (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173');

const ICONO_LOCAL = path.join(__dirname, '..', 'assets', 'icons', 'icono_hoja.png');

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
    console.error('Error enviando correo:', error);
    return { success: false, error: error.message };
  }
};

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('[email] Conexión SMTP verificada');
  } catch (error) {
    console.error('[email] No se pudo verificar la conexión SMTP:', error.message);
  }
};

const getLogoAttachment = () => {
  if (!fs.existsSync(ICONO_LOCAL)) {
    console.warn(`[email] Icono no encontrado en ${ICONO_LOCAL}`);
    return null;
  }

  return {
    filename: 'icono_hoja.png',
    path: ICONO_LOCAL,
    cid: 'ecominds-logo',
  };
};

export const buildEmailTemplate = ({ title, message, actionUrl = null, actionText = null }) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#0f766e; padding:32px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:bold; letter-spacing:-0.5px;">EcoMinds</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 32px 0; text-align:center;">
                  <img src="cid:ecominds-logo" alt="EcoMinds Logo" width="120" height="120" style="border-radius:50%; object-fit:cover; display:block; margin:0 auto; border:4px solid #e0f2fe;">
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#111827; font-size:22px; font-weight:600; text-align:center;">${title}</h2>
                  <div style="color:#4b5563; font-size:16px; line-height:1.6; text-align:center;">
                    ${message}
                  </div>
                  ${actionUrl ? `
                  <div style="text-align:center; margin-top:32px;">
                    <a href="${actionUrl}" style="display:inline-block; background-color:#0f766e; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-weight:600; font-size:16px;">
                      ${actionText || 'Abrir en EcoMinds'}
                    </a>
                  </div>
                  ` : ''}
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb; padding:24px 32px; text-align:center; border-top:1px solid #e5e7eb;">
                  <p style="margin:0 0 8px; color:#6b7280; font-size:14px;">
                    Este correo fue enviado por <strong>EcoMinds</strong>
                  </p>
                  <p style="margin:0; color:#9ca3af; font-size:12px;">
                    © ${new Date().getFullYear()} EcoMinds. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendEmailWithTemplate = async ({ to, subject, title, message, actionUrl, actionText }) => {
  const html = buildEmailTemplate({ title, message, actionUrl, actionText });
  const attachment = getLogoAttachment();
  const attachments = attachment ? [attachment] : [];

  const result = await sendEmail({ to, subject, html, attachments });
  if (!result.success) throw new Error(result.error);
  return result;
};

export const sendVerificationEmail = async (user, token) => {
  const link = `${frontendUrl}/app/verify-email?token=${token}`;

  await sendEmailWithTemplate({
    to: user.email,
    subject: 'Verifica tu cuenta en EcoMinds',
    title: 'Verifica tu cuenta',
    message: `
      <p>Hola <strong>${user.nombre}</strong>,</p>
      <p>Gracias por registrarte en EcoMinds. Haz clic en el botón de abajo para verificar tu cuenta y comenzar a usar la plataforma.</p>
    `,
    actionUrl: link,
    actionText: 'Verificar cuenta',
  });
};

export const sendResetPasswordEmail = async (user, token) => {
  const link = `${frontendUrl}/app/reset-password?token=${token}`;

  await sendEmailWithTemplate({
    to: user.email,
    subject: 'Restablecer contraseña en EcoMinds',
    title: 'Restablecer contraseña',
    message: `
      <p>Hola <strong>${user.nombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar.</p>
      <p style="font-size:14px; color:#6b7280; margin-top:16px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    `,
    actionUrl: link,
    actionText: 'Restablecer contraseña',
  });
};