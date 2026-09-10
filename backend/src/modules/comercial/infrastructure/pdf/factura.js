/**
 * Plantilla PDF: Factura.
 * Genera el documento PDF de una factura con sus items, subtotal, impuesto y total.
 */
import PDFDocument from 'pdfkit';

const formatoMonto = (monto) => Number(monto || 0).toFixed(2);

const construirPdfFactura = (factura) => new Promise((resolve, reject) => {
  const documento = new PDFDocument({ margin: 50, size: 'A4' });
  const partes = [];
  documento.on('data', (parte) => partes.push(parte));
  documento.on('end', () => resolve(Buffer.concat(partes)));
  documento.on('error', reject);

  documento.fontSize(22).fillColor('#14532d').text('EcoMinds', { align: 'right' });
  documento.fontSize(11).fillColor('#334155').text('Auditoria ambiental', { align: 'right' });
  documento.moveDown(2);
  documento.fontSize(20).fillColor('#111827').text(`Factura ${factura.numero}`);
  documento.moveDown(0.5);
  documento.fontSize(10).fillColor('#374151');
  documento.text(`Empresa: ${factura.empresa?.nombre || 'No disponible'}`);
  if (factura.empresa?.rif) documento.text(`RIF: ${factura.empresa.rif}`);
  documento.text(`Fecha de emision: ${factura.fechaEmision}`);
  if (factura.fechaVencimiento) documento.text(`Fecha de vencimiento: ${factura.fechaVencimiento}`);
  documento.moveDown();

  const columnas = { descripcion: 50, cantidad: 320, unitario: 390, total: 470 };
  documento.fontSize(10).fillColor('#14532d');
  documento.text('Descripcion', columnas.descripcion, documento.y);
  documento.text('Cantidad', columnas.cantidad, documento.y - 12);
  documento.text('Precio unit.', columnas.unitario, documento.y - 12);
  documento.text('Total', columnas.total, documento.y - 12);
  documento.moveTo(50, documento.y + 4).lineTo(545, documento.y + 4).stroke('#94a3b8');
  documento.moveDown();

  factura.items.forEach((item) => {
    if (documento.y > 710) documento.addPage();
    const posicionY = documento.y;
    documento.fillColor('#111827').text(item.descripcion, columnas.descripcion, posicionY, { width: 255 });
    documento.text(formatoMonto(item.cantidad), columnas.cantidad, posicionY, { width: 60, align: 'right' });
    documento.text(formatoMonto(item.precioUnitario), columnas.unitario, posicionY, { width: 70, align: 'right' });
    documento.text(formatoMonto(item.total), columnas.total, posicionY, { width: 70, align: 'right' });
    documento.moveDown();
  });

  documento.moveDown();
  documento.fontSize(11).fillColor('#111827');
  documento.text(`Subtotal: ${formatoMonto(factura.subtotal)}`, { align: 'right' });
  documento.text(`Impuesto: ${formatoMonto(factura.impuesto)}`, { align: 'right' });
  documento.fontSize(13).fillColor('#14532d').text(`Total: ${formatoMonto(factura.total)}`, { align: 'right' });
  if (factura.notas) {
    documento.moveDown(2);
    documento.fontSize(10).fillColor('#374151').text(`Notas: ${factura.notas}`);
  }
  documento.end();
});

export { construirPdfFactura };
