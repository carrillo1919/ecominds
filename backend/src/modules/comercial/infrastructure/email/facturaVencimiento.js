/**
 * Plantilla de correo: Recordatorio de vencimiento de factura.
 * Se envía por el job diario cuando una factura emitida está próxima a vencer.
 */
const buildFacturaVencimiento = ({ numero, empresaNombre, fechaVencimiento, total, dias }) => {
  const encabezado = dias === 0
    ? 'La siguiente factura vence hoy:'
    : 'La siguiente factura está próxima a vencer:';
  return `
    <p>${encabezado}</p>
    <p><strong>Factura:</strong> ${numero}</p>
    <p><strong>Empresa:</strong> ${empresaNombre}</p>
    <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>
    <p><strong>Total pendiente:</strong> ${total}</p>
    <p>${dias === 0 ? 'Por favor, gestione el pago hoy.' : `Faltan ${dias} días para su vencimiento.`}</p>
  `;
};

export { buildFacturaVencimiento };
