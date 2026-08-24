import PDFDocument from 'pdfkit';

const COLORES = {
  BAJO: '#15803d',
  MEDIO: '#b45309',
  ALTO: '#b91c1c',
};

const ESTADO_LABEL = {
  cumple: 'Cumple',
  no_cumple: 'No cumple',
  na: 'No aplica',
};

const fecha = (valor) => {
  if (!valor) return '-';

  const date = new Date(valor);

  return `${String(date.getUTCDate()).padStart(2, '0')}/${
    String(date.getUTCMonth() + 1).padStart(2, '0')
  }/${date.getUTCFullYear()}`;
};

const linea = (doc) => {
  doc.moveDown(0.4);
  doc
    .strokeColor('#d4d4d8')
    .lineWidth(0.7)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(555, doc.y)
    .stroke();
  doc.moveDown(0.6);
};

const titulo = (doc, texto) => {
  doc
    .fillColor('#111827')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(texto);

  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica').fillColor('#111827');
};

const parrafoDato = (doc, etiqueta, valor) => {
  doc.font('Helvetica-Bold').text(`${etiqueta}: `, { continued: true });
  doc.font('Helvetica').text(valor || '-');
};

const construirInforme = (auditoria, resumen) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Informe de auditoría ${auditoria.codigo || ''}`,
    },
  });

  doc
    .fillColor('#0f172a')
    .fontSize(17)
    .font('Helvetica-Bold')
    .text('Informe Ejecutivo de Auditabilidad');

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#475569')
    .text(
      'SRCD - Sistema de Registro y Control de Cumplimiento | Materiales y Desechos Peligrosos (Venezuela)',
    );

  linea(doc);

  titulo(doc, 'Datos generales');
  parrafoDato(doc, 'Empresa', auditoria.empresa?.nombre);
  parrafoDato(doc, 'RIF', auditoria.empresa?.rif);
  parrafoDato(doc, 'Sector / actividad', auditoria.empresa?.sector);
  parrafoDato(doc, 'Código de auditoría', auditoria.codigo);
  parrafoDato(doc, 'Fecha de auditoría', fecha(auditoria.fecha));
  parrafoDato(
    doc,
    'Próxima auditoría',
    fecha(auditoria.fechaProximaAuditoria),
  );
  parrafoDato(
    doc,
    'Auditor',
    auditoria.auditor
      ? `${auditoria.auditor.nombre} ${auditoria.auditor.apellido}`
      : '-',
  );
  parrafoDato(
    doc,
    'Estado',
    auditoria.estado === 'finalizada' ? 'Finalizada' : 'Borrador',
  );

  if (auditoria.alcance) {
    parrafoDato(doc, 'Alcance', auditoria.alcance);
  }

  linea(doc);

  titulo(doc, 'Resultado y matriz de riesgo');
  parrafoDato(doc, 'Total de requisitos', String(resumen.totalRequisitos));
  parrafoDato(doc, 'No aplica (N/A)', String(resumen.totalNoAplica));
  parrafoDato(doc, 'Requisitos aplicables', String(resumen.aplicables));
  parrafoDato(doc, 'Cumple', String(resumen.totalCumple));
  parrafoDato(doc, 'No cumple', String(resumen.totalNoCumple));
  parrafoDato(
    doc,
    '% Cumplimiento',
    `${resumen.porcentajeCumplimiento}%`,
  );
  parrafoDato(
    doc,
    '% No cumplimiento',
    `${resumen.porcentajeNoCumplimiento}%`,
  );

  doc.moveDown(0.3);
  doc
    .font('Helvetica-Bold')
    .fillColor(COLORES[resumen.nivelRiesgo] || '#111827')
    .fontSize(12)
    .text(`Nivel de riesgo operacional: ${resumen.nivelRiesgo}`);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(
      'Criterio: Bajo < 15% | Medio 15% - 29,9% | Alto >= 30% de incumplimiento sobre requisitos aplicables.',
    );

  if (resumen.riesgoEscalado) {
    doc
      .fillColor('#b91c1c')
      .text(
        `Severidad elevada automáticamente (nivel base ${resumen.nivelBase}) por ${resumen.hallazgosCriticos.length} incumplimiento(s) de requisitos críticos.`,
      );
  }

  doc.fillColor('#111827');
  linea(doc);

  titulo(doc, 'Estado por bloque legal');

  resumen.bloques.forEach((bloque) => {
    doc.font('Helvetica-Bold').text(bloque.bloque, { continued: true });
    doc
      .font('Helvetica')
      .text(
        ` - Cumple ${bloque.cumple} | No cumple ${bloque.noCumple} | N/A ${bloque.noAplica} | Incumplimiento ${bloque.porcentajeNoCumplimiento}% | Riesgo ${bloque.nivelRiesgo}`,
      );
  });

  linea(doc);

  titulo(doc, 'Hallazgos críticos');

  if (!resumen.hallazgosCriticos.length) {
    doc.text('No se registraron incumplimientos en requisitos críticos.');
  } else {
    resumen.hallazgosCriticos.forEach((hallazgo) => {
      doc
        .fillColor('#b91c1c')
        .font('Helvetica-Bold')
        .text(`${hallazgo.codigo} (${hallazgo.bloque})`);

      doc
        .fillColor('#111827')
        .font('Helvetica')
        .text(hallazgo.requisito);

      if (hallazgo.observaciones) {
        doc
          .fillColor('#475569')
          .text(`Observación: ${hallazgo.observaciones}`)
          .fillColor('#111827');
      }

      doc.moveDown(0.2);
    });
  }

  linea(doc);

  const noCumple = (auditoria.items || [])
    .filter((item) => item.estado === 'no_cumple');

  titulo(doc, 'Plan de acciones correctivas y preventivas (CAPA)');

  if (!noCumple.length) {
    doc.text(
      'Sin incumplimientos registrados: no se requieren acciones correctivas.',
    );
  } else {
    noCumple.forEach((item) => {
      if (doc.y > 720) doc.addPage();

      doc
        .font('Helvetica-Bold')
        .text(`${item.requisito?.codigo} - ${item.requisito?.bloque}`);

      doc
        .font('Helvetica')
        .text(item.requisito?.requisito || '');

      if (item.observaciones) {
        doc
          .fillColor('#475569')
          .text(`Hallazgo: ${item.observaciones}`);
      }

      doc
        .fillColor('#111827')
        .text(`Acción correctiva: ${item.accionCorrectiva || 'Por definir'}`);

      doc.text(
        `Responsable: ${item.responsableAccion || 'Por asignar'} | Fecha compromiso: ${fecha(item.fechaCompromiso)}`,
      );

      doc.moveDown(0.4);
    });
  }

  linea(doc);

  doc.addPage();
  titulo(doc, 'Anexo: detalle del checklist evaluado');

  (auditoria.items || []).forEach((item) => {
    if (doc.y > 760) doc.addPage();

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        `${item.requisito?.codigo} [${
          ESTADO_LABEL[item.estado] || 'Sin evaluar'
        }]${item.requisito?.critico ? ' *CRÍTICO*' : ''}`,
      );

    doc
      .font('Helvetica')
      .fontSize(9)
      .text(item.requisito?.requisito || '');

    if (item.observaciones) {
      doc
        .fillColor('#475569')
        .text(`Obs: ${item.observaciones}`)
        .fillColor('#111827');
    }

    doc.moveDown(0.25);
  });

  if (auditoria.conclusiones) {
    linea(doc);
    titulo(doc, 'Conclusiones del auditor');
    doc.fontSize(9.5).text(auditoria.conclusiones);
  }

  doc.moveDown(1);
  doc
    .fontSize(8)
    .fillColor('#64748b')
    .text(
      `Documento generado automáticamente el ${fecha(new Date())} por el SRCD.`,
      { align: 'center' },
    );

  return doc;
};

export { construirInforme };
