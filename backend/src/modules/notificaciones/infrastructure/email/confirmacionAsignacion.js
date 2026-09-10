/**
 * Plantilla de correo: Confirmación de asignación de producto/servicio.
 * Se envía al responsable de la empresa y al admin cuando se crea una asignación.
 */
const buildConfirmacionAsignacion = ({ nombreItem, empresaNombre, fecha, tipoFecha }) => `
  <p>Hola,</p>
  <p>Se ha registrado una nueva asignación:</p>
  <p><strong>Empresa:</strong> ${empresaNombre}</p>
  <p><strong>${nombreItem}</strong></p>
  <p><strong>Fecha de ${tipoFecha}:</strong> ${fecha}</p>
`;

export { buildConfirmacionAsignacion };
