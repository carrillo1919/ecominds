import { sendEmailWithTemplate } from '../../../shared/infrastructure/email/emailService.js';
import { buildVerificacionCuenta } from '../infrastructure/email/verificacionCuenta.js';
import { buildRestablecerPassword } from '../infrastructure/email/restablecerPassword.js';

const frontendUrl = process.env.EMAIL_FRONTEND_URL ||
  (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'http://localhost:5173');

export const sendVerificationEmail = async (user, token) => {
  const link = `${frontendUrl}/app/verify-email?token=${token}`;

  await sendEmailWithTemplate({
    to: user.email,
    subject: 'Verifica tu cuenta en EcoMinds',
    title: 'Verifica tu cuenta',
    message: buildVerificacionCuenta({ nombre: user.nombre, link }),
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
    message: buildRestablecerPassword({ nombre: user.nombre, link }),
    actionUrl: link,
    actionText: 'Restablecer contraseña',
  });
};
