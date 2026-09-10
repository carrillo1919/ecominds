/**
 * Plantilla de correo: Restablecer contraseña.
 * Se envía cuando un usuario solicita recuperar su contraseña.
 */
const buildRestablecerPassword = ({ nombre, link }) => `
  <p>Hola <strong>${nombre}</strong>,</p>
  <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar.</p>
  <p style="font-size:14px; color:#6b7280; margin-top:16px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
`;

export { buildRestablecerPassword };
