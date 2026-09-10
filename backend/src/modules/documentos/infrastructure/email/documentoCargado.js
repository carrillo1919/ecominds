/**
 * Plantilla de correo: Nuevo documento cargado.
 * Se envía al responsable de la empresa y al admin cuando se carga un documento.
 */
const buildDocumentoCargado = ({ titulo, empresaNombre, fechaVencimiento }) => `
  <p>Se ha cargado un nuevo documento en la plataforma.</p>
  <p><strong>Documento:</strong> ${titulo}</p>
  <p><strong>Empresa:</strong> ${empresaNombre}</p>
  <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>
`;

export { buildDocumentoCargado };
