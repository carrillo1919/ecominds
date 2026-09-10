/**
 * Plantilla de correo: Auditoría finalizada.
 * Se envía al responsable de la empresa y al admin cuando una auditoría se finaliza.
 */
const buildAuditoriaFinalizada = ({ codigo, empresaNombre, fecha }) => `
  <p>La siguiente auditoría ha sido finalizada:</p>
  <p><strong>Código:</strong> ${codigo}</p>
  <p><strong>Empresa:</strong> ${empresaNombre}</p>
  <p><strong>Fecha:</strong> ${fecha}</p>
  <p>Ingresa a la plataforma para revisar los resultados.</p>
`;

export { buildAuditoriaFinalizada };
