/**
 * Plantilla de correo: Factura pagada.
 * Se envía al responsable de la empresa y al admin cuando se registra el pago de una factura.
 */
const buildFacturaPagada = ({ numero, empresaNombre, fechaPago, metodoPago, totalPagado }) => `
  <p>La factura de <strong>${empresaNombre}</strong> ha sido marcada como <strong>pagada</strong>.</p>
  <p><strong>Fecha de pago:</strong> ${fechaPago}</p>
  <p><strong>Método de pago:</strong> ${metodoPago}</p>
  <p><strong>Total pagado:</strong> ${totalPagado}</p>
  <p>La factura se encuentra adjunta a este correo.</p>
`;

export { buildFacturaPagada };
