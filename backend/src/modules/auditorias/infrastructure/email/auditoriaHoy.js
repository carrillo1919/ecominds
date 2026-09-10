/**
 * Plantilla de correo: Auditoría programada para hoy.
 * Se envía por el job diario cuando hay una auditoría el día actual.
 */
const buildAuditoriaHoy = ({ codigo, fecha }) => `
  <p>Tienes una auditoría programada para el día de hoy:</p>
  <p><strong>Código:</strong> ${codigo}</p>
  <p><strong>Fecha:</strong> ${fecha}</p>
`;

export { buildAuditoriaHoy };
