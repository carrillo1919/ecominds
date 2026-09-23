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
const tieneTexto = (valor) => {
  const normalizado = texto(valor).trim().toLowerCase();
  return normalizado.length > 0 && normalizado !== 'null' && normalizado !== 'undefined';
};
const responsable = (item) => {
  if (tieneTexto(item.responsableAccion)) return item.responsableAccion.trim();
  if (!item.responsableEmpleado) return '';
  const nombre = `${item.responsableEmpleado.apellido || ''}, ${item.responsableEmpleado.nombre || ''}`
    .replace(/^,\s*|\s*,\s*$/g, '');
  return tieneTexto(nombre) ? nombre : '';
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
    .text(`Página ${numeroPagina} de ${totalPaginas}`, 455, 193, { width: 100, align: 'right' });
};

const estado = (doc, valor, x, y) => {
  ESTADOS.forEach(([codigo, etiqueta], indice) => {
    const posicionX = x + (indice * 77);
    doc.rect(posicionX, y, 9, 9).lineWidth(0.7).strokeColor('#4b5563').stroke();
    if (valor === codigo) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#111827')
        .text('X', posicionX + 1, y - 1);
    }
    doc.font('Helvetica').fontSize(7).fillColor('#111827').text(etiqueta, posicionX + 12, y + 1);
  });
};

const alturaTexto = (doc, valor, width, fontSize, minimo = 0) => {
  if (!valor) return minimo;
  doc.font('Helvetica').fontSize(fontSize);
  return Math.max(minimo, doc.heightOfString(texto(valor), { width }));
};

const alturaItem = (doc, item) => {
  const requisito = item.requisito || {};
  const requisitoAltura = alturaTexto(doc, requisito.requisito, 310, 7.5, 18);
  const observacionesAltura = alturaTexto(doc, item.observaciones, 398, 7, 10);
  const accionAltura = tieneTexto(item.accionCorrectiva)
    ? alturaTexto(doc, item.accionCorrectiva, 419, 7, 10) + 2
    : 0;
  const tieneResponsableOFecha = tieneTexto(responsable(item)) || Boolean(item.fechaCompromiso);
  const responsableAltura = tieneResponsableOFecha ? 12 : 0;

  return 33 + requisitoAltura + observacionesAltura + accionAltura + responsableAltura;
};

const imprimirItem = (doc, item, indice, y, height) => {
  const requisito = item.requisito || {};
  const x = 40;
  const width = 515;
  const requisitoAltura = alturaTexto(doc, requisito.requisito, 310, 7.5, 18);
  const observacionesY = y + 23 + requisitoAltura;
  const observacionesAltura = alturaTexto(doc, item.observaciones, 398, 7, 10);
  const accionY = observacionesY + observacionesAltura + 2;
  const tieneAccion = tieneTexto(item.accionCorrectiva);
  const accionAltura = tieneAccion ? alturaTexto(doc, item.accionCorrectiva, 419, 7, 10) : 0;
  const responsableY = accionY + accionAltura + (tieneAccion ? 2 : 0);
  const nombreResponsable = responsable(item);
  const tieneResponsableOFecha = tieneTexto(nombreResponsable) || Boolean(item.fechaCompromiso);

  doc.rect(x, y, width, height).lineWidth(0.7).strokeColor('#9ca3af').stroke();
  doc
    .fillColor('#064e3b')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(
      `${indice + 1}. ${texto(requisito.codigo) || 'Sin código'}${requisito.critico ? ' - CRÍTICO' : ''}`,
      x + 6,
      y + 6,
    );
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#4b5563')
    .text(`Bloque: ${texto(requisito.bloque) || '-'}`, x + 105, y + 7, { width: 190 })
    .text(`Base legal: ${texto(requisito.baseLegal) || '-'}`, x + 300, y + 7, { width: 145 });
  estado(doc, item.estado, x + 328, y + 22);

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#111827')
    .text(texto(requisito.requisito) || 'Requisito no disponible.', x + 6, y + 21, {
      width: 310,
      height: requisitoAltura,
    });
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor('#374151')
    .text('Observaciones / hallazgo:', x + 6, observacionesY);
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#111827')
    .text(texto(item.observaciones) || '________________________________________________________________________________', x + 111, observacionesY, {
      width: 398,
      height: observacionesAltura,
    });

  if (tieneAccion) {
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#374151')
      .text('Acción correctiva:', x + 6, accionY);
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#111827')
      .text(item.accionCorrectiva.trim(), x + 90, accionY, {
        width: 419,
        height: accionAltura,
      });
  }

  if (tieneResponsableOFecha) {
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor('#374151');
    if (tieneTexto(nombreResponsable)) doc.text('Responsable:', x + 6, responsableY);
    if (item.fechaCompromiso) doc.text('Fecha:', x + 390, responsableY);
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#111827');
    if (tieneTexto(nombreResponsable)) doc.text(nombreResponsable, x + 62, responsableY, { width: 300 });
    if (item.fechaCompromiso) doc.text(fecha(item.fechaCompromiso), x + 424, responsableY, { width: 84 });
  }
};

const firmas = (doc, y) => {
  doc
    .strokeColor('#9ca3af')
    .lineWidth(0.7)
    .moveTo(40, y)
    .lineTo(250, y)
    .moveTo(345, y)
    .lineTo(555, y)
    .stroke();
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#4b5563')
    .text('Firma del auditor', 40, y + 6, { width: 210, align: 'center' })
    .text('Firma del responsable de la empresa', 345, y + 6, { width: 210, align: 'center' });
};

const tituloBloque = (doc, bloque, y) => {
  doc
    .fillColor('#064e3b')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(`BLOQUE: ${bloque || 'SIN CLASIFICAR'}`, 40, y);
  doc
    .strokeColor('#059669')
    .lineWidth(0.7)
    .moveTo(40, y + 13)
    .lineTo(555, y + 13)
    .stroke();
};

const construirFormatoCampoAuditoria = (auditoria) => {
  const items = auditoria.items || [];
  const inicioItems = 215;
  const limiteItems = 755;
  const altoFirmas = 35;
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

  const paginas = [];
  let indice = 0;

  while (indice < items.length) {
    const paginaActual = [];
    let alturaActual = paginas.length === 0 ? inicioItems : 40;
    let bloquePagina = null;

    while (indice < items.length) {
      const item = items[indice];
      const altura = alturaItem(doc, item);
      const bloque = texto(item.requisito?.bloque).trim() || 'Sin clasificar';
      const nuevoBloque = bloque !== bloquePagina;
      const alturaTitulo = nuevoBloque ? 20 : 0;
      const sinEspacio = alturaActual + alturaTitulo + altura > limiteItems;

      if (paginaActual.length && sinEspacio) break;

      if (nuevoBloque) {
        paginaActual.push({ tipo: 'bloque', bloque, altura: alturaTitulo });
        alturaActual += alturaTitulo;
        bloquePagina = bloque;
      }

      paginaActual.push({ tipo: 'item', item, altura, indice });
      alturaActual += altura + 5;
      indice += 1;
    }

    paginas.push(paginaActual);
  }

  const ultimaPagina = paginas[paginas.length - 1];
  const inicioUltimaPagina = paginas.length === 1 ? inicioItems : 40;
  const alturaUltimaPagina = ultimaPagina.reduce(
    (total, entrada) => total + entrada.altura + (entrada.tipo === 'item' ? 5 : 0),
    inicioUltimaPagina,
  );
  const paginaSoloFirmas = alturaUltimaPagina + altoFirmas > limiteItems;
  if (paginaSoloFirmas) paginas.push([]);

  paginas.forEach((itemsPagina, pagina) => {
    if (pagina) doc.addPage();

    if (pagina === 0) {
      cabecera(doc, auditoria, pagina + 1, paginas.length);
    } else {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7280')
        .text(`Página ${pagina + 1} de ${paginas.length}`, 455, 30, { width: 100, align: 'right' });
    }
    let y = pagina === 0 ? inicioItems : 40;
    itemsPagina.forEach((entrada) => {
      if (entrada.tipo === 'bloque') {
        tituloBloque(doc, entrada.bloque, y);
        y += entrada.altura;
        return;
      }

      imprimirItem(doc, entrada.item, entrada.indice, y, entrada.altura);
      y += entrada.altura + 5;
    });

    if (pagina === paginas.length - 1) {
      firmas(doc, itemsPagina.length ? Math.max(y + 12, 705) : 705);
    }
    doc
      .fontSize(7)
      .fillColor('#6b7280')
      .text(`Formato generado el ${fecha(new Date())}`, 40, 785)
      .text(`${auditoria.codigo || auditoria.id}`, 430, 785, { width: 125, align: 'right' });
  });

  return doc;
};

export { construirFormatoCampoAuditoria };
