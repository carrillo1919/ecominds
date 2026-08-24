import { Resend } from 'resend';

const FRONTEND_URL = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

let resend;

const getResend = () => {
  if (resend) return resend;

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no está configurada');
  }

  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

const verifyResendConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[resend] RESEND_API_KEY no configurada');
    return false;
  }

  // Las claves restringidas solo tienen permiso para enviar correos.
  getResend();

  console.log('[resend] Cliente configurado correctamente');
  return true;
};

const send = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[emailService] RESEND_API_KEY no configurada', {
      to,
      subject,
    });

    return { skipped: true };
  }

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM || 'SRCD <onboarding@resend.dev>',
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Error enviando correo con Resend: ${error.message}`);
  }

  return data;
};

const layout = (titulo, cuerpo) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <h2 style="color:#0f4c81">SRCD - Auditoría de Cumplimiento</h2>
    <h3>${titulo}</h3>
    ${cuerpo}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <p style="font-size:12px;color:#6b7280">
      Este es un correo automático, por favor no responda a esta dirección.
    </p>
  </div>
`;

const sendVerificationEmail = (user, token) => {
  const url = `${FRONTEND_URL()}/verify-email?token=${encodeURIComponent(token)}`;

  return send({
    to: user.email,
    subject: 'Verifique su cuenta SRCD',
    html: layout(
      `Hola ${user.nombre},`,
      `<p>Su cuenta fue creada correctamente. Para activarla haga clic en el siguiente enlace:</p>
       <p><a href="${url}">Verificar mi cuenta</a></p>
       <p style="word-break:break-all">${url}</p>`,
    ),
  });
};

const sendResetPasswordEmail = (user, token) => {
  const url = `${FRONTEND_URL()}/reset-password?token=${encodeURIComponent(token)}`;

  return send({
    to: user.email,
    subject: 'Restablecer su contraseña SRCD',
    html: layout(
      `Hola ${user.nombre},`,
      `<p>Recibimos una solicitud para restablecer su contraseña. El enlace es válido por <strong>1 hora</strong>.</p>
       <p><a href="${url}">Restablecer contraseña</a></p>
       <p style="word-break:break-all">${url}</p>
       <p>Si usted no solicitó este cambio, ignore este correo.</p>`,
    ),
  });
};

export {
  sendVerificationEmail,
  sendResetPasswordEmail,
  send,
  verifyResendConnection,
};
