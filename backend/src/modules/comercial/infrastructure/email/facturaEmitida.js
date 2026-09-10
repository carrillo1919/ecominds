/**
 * Plantilla de correo: Factura emitida.
 * Se envía al responsable de la empresa y al admin cuando se emite una factura.
 */
const buildFacturaEmitida = ({ numero, empresaNombre, total }) => `
  <p>Se ha emitido una factura para <strong>${empresaNombre}</strong>.</p>
  <p><strong>Total:</strong> ${total}</p>
  <p>La factura se encuentra adjunta a este correo.</p>
`;

export { buildFacturaEmitida };
