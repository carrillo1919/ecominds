import PDFDocument from 'pdfkit';

const ESTADOS = [
  ['cumple', 'Cumple'],
  ['no_cumple', 'No cumple'],
  ['na', 'No aplica'],
];

const fecha = (valor) => {
  if (!valor) return '';
  const date = new Date(valor);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
};

const texto = (valor) => (valor ? String(valor) : '');
const responsable = (item) => {
  if (item.responsableAccion) return item.responsableAccion;
  if (!item.responsableEmpleado) return '';
  return `${item.responsableEmpleado.apellido || ''}, ${item.responsableEmpleado.nombre || ''}`
    .replace(/^,\s*|\s*,\s*$/g, '');
};

const caja = (doc, { etiqueta, valor, x, y, width, height }) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#374151')
    .text(etiqueta, x, y);
  doc
    .rect(x, y + 13, width, height)
    .lineWidth(0.7)
    .strokeColor('#9ca3af')
    .stroke();
  if (valor) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#111827')
      .text(texto(valor), x + 7, y + 20, { width: width - 14, height: height - 10 });
  }
};

const cabecera = (doc, auditoria, numeroPagina, totalPaginas) => {
  const empresa = auditoria.empresa || {};
  const auditor = auditoria.auditor
    ? `${auditoria.auditor.nombre} ${auditoria.auditor.apellido}`
    : '';

  doc
    .fillColor('#064e3b')
    .font('Helvetica-Bold')
    .fontSize(15)
    .text('FORMATO DE AUDITORIA');
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#4b5563')
    .text('Checklist para verificación manual de requisitos de cumplimiento');

  doc
    .strokeColor('#059669')
    .lineWidth(1)
    .moveTo(40, 76)
    .lineTo(555, 76)
    .stroke();

  doc
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(empresa.nombre || 'Empresa', 40, 89);
  doc
    .font('Helvetica')
    .fontSize(8)
    .text(`RIF: ${texto(empresa.rif) || '-'}`, 40, 103)
    .text(`Dirección: ${texto(empresa.direccion) || '-'}`, 40, 115, { width: 330 })
    .text(`Contacto: ${[empresa.telefono, empresa.email].filter(Boolean).join(' | ') || '-'}`, 40, 127, { width: 330 });

  doc
    .font('Helvetica-Bold')
    .text('Auditoría', 390, 89)
    .font('Helvetica')
    .text(`Código: ${texto(auditoria.codigo) || '-'}`, 390, 103)
    .text(`Fecha: ${fecha(auditoria.fecha) || '-'}`, 390, 115)
    .text(`Auditor: ${auditor || '-'}`, 390, 127, { width: 165 });

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#374151')
    .text('Alcance', 40, 148);
  doc
    .font('Helvetica')
    .fillColor('#111827')
    .text(texto(auditoria.alcance) || '____________________________________________________________', 40, 160, {
      width: 515,
      height: 24,
    });
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#6b7280')
    .text(
      'Marque el estado correspondiente y registre los hallazgos y acciones durante la visita.',
      40,
      193,
    )
    .text(`Ítem ${numeroPagina} de ${totalPaginas}`, 455, 193, { width: 100, align: 'right' });
};

const estado = (doc, valor) => {
  const y = 344;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text('Estado de cumplimiento', 40, y);

  ESTADOS.forEach(([codigo, etiqueta], indice) => {
    const x = 40 + (indice * 160);
    doc.rect(x, y + 16, 11, 11).lineWidth(0.7).strokeColor('#4b5563').stroke();
    if (valor === codigo) {
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('X', x + 1, y + 15);
    }
    doc.font('Helvetica').fontSize(8.5).fillColor('#111827').text(etiqueta, x + 17, y + 18);
  });
};

const construirFormatoCampoAuditoria = (auditoria) => {
  const items = auditoria.items || [];
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: { Title: `Formato de auditoría ${auditoria.codigo || ''}` },
  });

  if (!items.length) {
    cabecera(doc, auditoria, 0, 0);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111827')
      .text('Esta auditoría no tiene requisitos asociados.', 40, 240);
    return doc;
  }

  items.forEach((item, indice) => {
    if (indice) doc.addPage();

    cabecera(doc, auditoria, indice + 1, items.length);

    const requisito = item.requisito || {};
    doc
      .fillColor('#064e3b')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`${texto(requisito.codigo) || `Ítem ${indice + 1}`}${requisito.critico ? '  -  CRÍTICO' : ''}`, 40, 220);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#4b5563')
      .text(`Bloque: ${texto(requisito.bloque) || '-'}`, 40, 235)
      .text(`Base legal: ${texto(requisito.baseLegal) || '-'}`, 40, 247, { width: 515, height: 22 });

    caja(doc, {
      etiqueta: 'Requisito a verificar',
      valor: requisito.requisito,
      x: 40,
      y: 275,
      width: 515,
      height: 52,
    });

    estado(doc, item.estado);

    caja(doc, {
      etiqueta: 'Observaciones / hallazgo',
      valor: item.observaciones,
      x: 40,
      y: 382,
      width: 515,
      height: 88,
    });
    caja(doc, {
      etiqueta: 'Acción correctiva (CAPA)',
      valor: item.accionCorrectiva,
      x: 40,
      y: 487,
      width: 515,
      height: 88,
    });
    caja(doc, {
      etiqueta: 'Responsable de la acción',
      valor: responsable(item),
      x: 40,
      y: 592,
      width: 248,
      height: 28,
    });
    caja(doc, {
      etiqueta: 'Fecha compromiso',
      valor: fecha(item.fechaCompromiso),
      x: 307,
      y: 592,
      width: 248,
      height: 28,
    });

    doc
      .strokeColor('#9ca3af')
      .lineWidth(0.7)
      .moveTo(40, 690)
      .lineTo(250, 690)
      .moveTo(345, 690)
      .lineTo(555, 690)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#4b5563')
      .text('Firma del auditor', 40, 696, { width: 210, align: 'center' })
      .text('Firma del responsable de la empresa', 345, 696, { width: 210, align: 'center' });
    doc
      .fontSize(7)
      .fillColor('#6b7280')
      .text(`Formato generado el ${fecha(new Date())}`, 40, 785)
      .text(`${auditoria.codigo || auditoria.id}`, 430, 785, { width: 125, align: 'right' });
  });

  return doc;
};

export { construirFormatoCampoAuditoria };
