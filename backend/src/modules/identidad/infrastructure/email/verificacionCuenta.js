/**
 * Plantilla de correo: Verificación de cuenta.
 * Se envía al registrarse un nuevo usuario.
 */
const buildVerificacionCuenta = ({ nombre, link }) => `
  <p>Hola <strong>${nombre}</strong>,</p>
  <p>Gracias por registrarte en EcoMinds. Haz clic en el botón de abajo para verificar tu cuenta y comenzar a usar la plataforma.</p>
`;

export { buildVerificacionCuenta };
