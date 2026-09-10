/**
 * Plantilla de correo: Recordatorio de vencimiento de documento.
 * Se envía por el job diario cuando un documento está próximo a vencer.
 */
const buildDocumentoVencimiento = ({ titulo, fechaVencimiento }) => `
  <p>El siguiente documento está próximo a vencer:</p>
  <p><strong>Documento:</strong> ${titulo}</p>
  <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>
  <p>Por favor, actualiza o renueva el documento antes de la fecha límite.</p>
`;

export { buildDocumentoVencimiento };
