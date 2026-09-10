/**
 * Plantilla de correo: Recordatorio de asignación de producto/servicio.
 * Se envía por el job de recordatorios cuando una entrega/ejecución está próxima.
 */
const buildRecordatorioAsignacion = ({ nombreItem, empresaNombre, fecha, dias }) => {
  const titulo = dias === 0
    ? `Recordatorio: ${nombreItem} para hoy`
    : `Recordatorio: ${nombreItem} en ${dias} día(s)`;
  return {
    titulo,
    cuerpo: `
      <p>Hola,</p>
      <p>Te recordamos la siguiente entrega/ejecución programada:</p>
      <p><strong>Empresa:</strong> ${empresaNombre}</p>
      <p><strong>${nombreItem}</strong></p>
      <p><strong>Fecha:</strong> ${fecha}</p>
    `,
  };
};

export { buildRecordatorioAsignacion };
