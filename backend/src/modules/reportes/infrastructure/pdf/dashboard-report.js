import PDFDocument from 'pdfkit';

const labels = {
  numero: 'Número',
  empresa: 'Empresa',
  fechaEmision: 'F. emisión',
  fechaPago: 'F. pago',
  estado: 'Estado',
  total: 'Total',
  deuda: 'Deuda',
  tipoItems: 'Tipo',
  cantidadItems: 'Ítems',
};

const valor = (item, col) => {
  if (col === 'total' || col === 'deuda') return Number(item[col] || 0).toFixed(2);
  return item[col] ?? '—';
};

export const construirPdfDashboard = ({ data, columnas }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.fontSize(16).text('Dashboard avanzado - Reporte');
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generado: ${new Date().toISOString()}`);
  doc.text(`Filtros: Empresa=${data.filtrosAplicados.empresaId || 'todas'} | Desde=${data.filtrosAplicados.desde || '—'} | Hasta=${data.filtrosAplicados.hasta || '—'}`);

  doc.moveDown();
  doc.fontSize(12).text('KPIs');
  doc.fontSize(10)
    .text(`Total facturas: ${data.kpis.totalFacturas}`)
    .text(`Total facturado: ${Number(data.kpis.totalFacturado).toFixed(2)}`)
    .text(`Deuda total: ${Number(data.kpis.deudaTotal).toFixed(2)}`)
    .text(`Ingresos (fecha de pago): ${Number(data.kpis.ingresos).toFixed(2)}`)
    .text(`Empleados: ${data.kpis.totalEmpleados}`)
    .text(`Auditorías finalizadas: ${data.kpis.totalAuditoriasFinalizadas}`);

  doc.moveDown();
  doc.fontSize(12).text('Facturas');

  const header = columnas.map((c) => labels[c] || c).join(' | ');
  doc.font('Helvetica-Bold').fontSize(9).text(header);
  doc.font('Helvetica').fontSize(8);

  data.tablaFacturas.items.forEach((item) => {
    const row = columnas.map((col) => valor(item, col)).join(' | ');
    doc.text(row, { width: 520 });
  });

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(11).text('Empleados');
  doc.font('Helvetica').fontSize(9);
  data.empleados.forEach((emp) => {
    doc.text(`${emp.empresa} - ${emp.nombreCompleto} - ${emp.cargo || 'Sin cargo'} - ${emp.email}`);
  });

  return doc;
};
