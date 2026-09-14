import PDFDocument from 'pdfkit';

const labels = {
  numero: 'Número',
  empresa: 'Empresa',
  fechaEmision: 'F. emisión',
  fechaPago: 'F. pago',
  estado: 'Estado',
  tipoItems: 'Tipo',
  descripcionItems: 'Descripción ítems',
  cantidadItems: 'Líneas',
  cantidadTotal: 'Cantidad',
  subtotal: 'Subtotal',
  descuento: 'Descuento',
  impuesto: 'Impuesto',
  total: 'Total',
  deuda: 'Deuda',
};

const COLUMNAS_NUMERICAS = ['subtotal', 'descuento', 'impuesto', 'total', 'deuda'];

const formatoNumero = (valor) => Number(valor || 0).toFixed(2);

const valor = (item, col) => {
  if (COLUMNAS_NUMERICAS.includes(col)) return formatoNumero(item[col]);
  return item[col] ?? '—';
};

const truncar = (texto, largo = 45) => {
  const str = String(texto ?? '');
  return str.length > largo ? `${str.slice(0, largo - 1)}…` : str;
};

const encabezadoItems = ['Factura', 'Empresa', 'F. emisión', 'Tipo', 'Descripción', 'Cant.', 'Unidad', 'Subtotal', 'Descuento', 'Impuesto', 'Total'].join(' | ');

const filaItem = (item) => [
  item.numero,
  truncar(item.empresa, 20),
  item.fechaEmision,
  item.tipo,
  truncar(item.descripcion, 45),
  item.cantidad,
  item.unidadMedida || '—',
  formatoNumero(item.subtotal),
  formatoNumero(item.descuento),
  formatoNumero(item.impuesto),
  formatoNumero(item.total),
].join(' | ');

const filaResumen = (etiqueta, grupo) => [
  etiqueta,
  `líneas: ${grupo.items}`,
  `cantidad: ${grupo.cantidad}`,
  `subtotal: ${formatoNumero(grupo.subtotal)}`,
  `descuento: ${formatoNumero(grupo.descuento)}`,
  `impuesto: ${formatoNumero(grupo.impuesto)}`,
  `total: ${formatoNumero(grupo.total)}`,
].join(' | ');

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
    .text(`Total facturado sin impuesto: ${formatoNumero(data.kpis.totalFacturadoSinImpuesto)}`)
    .text(`Descuentos: ${formatoNumero(data.kpis.totalDescuentos)}`)
    .text(`Impuestos: ${formatoNumero(data.kpis.totalImpuestos)}`)
    .text(`Total facturado con impuesto: ${formatoNumero(data.kpis.totalFacturado)}`)
    .text(`Deuda total: ${formatoNumero(data.kpis.deudaTotal)}`)
    .text(`Ingresos (fecha de pago): ${formatoNumero(data.kpis.ingresos)}`)
    .text(`Empleados: ${data.kpis.totalEmpleados}`)
    .text(`Auditorías finalizadas: ${data.kpis.totalAuditoriasFinalizadas}`);

  doc.moveDown();
  doc.fontSize(12).text('Ítems por tipo (productos / servicios)');
  doc.font('Helvetica').fontSize(9)
    .text(filaResumen('Total', data.resumenItems.todos))
    .text(filaResumen('Productos', data.resumenItems.producto))
    .text(filaResumen('Servicios', data.resumenItems.servicio));

  doc.moveDown();
  doc.fontSize(12).text('Facturas');

  const header = columnas.map((c) => labels[c] || c).join(' | ');
  doc.font('Helvetica-Bold').fontSize(9).text(header, { width: 520 });
  doc.font('Helvetica').fontSize(8);

  data.tablaFacturas.items.forEach((item) => {
    const row = columnas.map((col) => valor(item, col)).join(' | ');
    doc.text(row, { width: 520 });
  });

  doc.moveDown();
  doc.fontSize(12).text('Detalle de ítems');
  doc.font('Helvetica-Bold').fontSize(8).text(encabezadoItems, { width: 520 });
  doc.font('Helvetica').fontSize(7.5);

  data.detalleItems.forEach((item) => {
    doc.text(filaItem(item), { width: 520 });
  });

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(11).text('Empleados');
  doc.font('Helvetica').fontSize(9);
  data.empleados.forEach((emp) => {
    doc.text(`${emp.empresa} - ${emp.nombreCompleto} - ${emp.cargo || 'Sin cargo'} - ${emp.email}`);
  });

  return doc;
};
