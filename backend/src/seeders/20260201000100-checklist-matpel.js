'use strict';

// Checklist de Cumplimiento - Materiales y Desechos Peligrosos (Venezuela)
// Fuente: Checklist_Cumplimiento_MatPel_VE_Lur_Consultores.xlsx (55 requisitos)

const REQUISITOS = [
  {
    "bloque": "General",
    "codigo": "G-01",
    "requisito": "La empresa cuenta con un registro de todas las sustancias, materiales y desechos que utiliza, maneja o genera.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 1,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-02",
    "requisito": "Se encuentra registrada ante la autoridad ambiental como generador y/o manejador, según corresponda (RACDA).",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "Decreto 2635 (RACDA)",
    "critico": true,
    "orden": 2,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-03",
    "requisito": "Posee autorización vigente para las actividades que requieran permiso ambiental (recolección, transporte, almacenamiento, tratamiento, disposición). (Permiso RACDA)",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "Decreto 2635 (RACDA)",
    "critico": true,
    "orden": 3,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-04",
    "requisito": "Cuenta con expediente ambiental actualizado (registro, autorizaciones, recaudos técnicos).",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 4,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-05",
    "requisito": "Dispone de inventario actualizado de sustancias y materiales peligrosos presentes en la organización.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 5,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-06",
    "requisito": "Cada sustancia peligrosa cuenta con la correspondiente Hoja de Datos de Seguridad (HDS) disponible y accesible al personal.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 6,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-07",
    "requisito": "Las Hojas de Datos de Seguridad (HDS) cumplen con el formato técnico establecido por normativa nacional vigente (NTF 3059).",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "NTF 3059",
    "critico": false,
    "orden": 7,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-08",
    "requisito": "El personal que manipula sustancias/materiales peligrosos ha recibido capacitación y está documentada.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "LOPCYMAT Art. 53",
    "critico": false,
    "orden": 8,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-09",
    "requisito": "Existe procedimiento documentado para manejo seguro de sustancias/materiales peligrosos.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 9,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-10",
    "requisito": "Existe procedimiento para notificación inmediata de incidentes o accidentes ambientales.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 10,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-11",
    "requisito": "La empresa conserva registros de incidentes, derrames o eventos ambientales.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 11,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-12",
    "requisito": "Se suministra información veraz y completa a la autoridad ambiental cuando es requerida.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 12,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-13",
    "requisito": "Se realizan revisiones periódicas del cumplimiento legal ambiental.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 13,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-14",
    "requisito": "Se cuenta con un análisis de riesgos completo que incluye las medidas de prevención que deben adoptarse para proteger a las personas y el medio ambiente",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "LOPCYMAT / Decreto 2635",
    "critico": true,
    "orden": 14,
    "activo": true
  },
  {
    "bloque": "General",
    "codigo": "G-15",
    "requisito": "Se dispone de un plan de emergencias elaborado de acuerdo con la Norma COVENIN 2226:90",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "COVENIN 2226:90",
    "critico": true,
    "orden": 15,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-01",
    "requisito": "Existe área definida y delimitada para almacenamiento de materiales peligrosos.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 16,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-02",
    "requisito": "El área está señalizada conforme al tipo de riesgo (inflamable, tóxico, corrosivo, etc.).",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 17,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-03",
    "requisito": "Los materiales están segregados según compatibilidad química.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 18,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-04",
    "requisito": "No se almacenan sustancias incompatibles juntas.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 19,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-05",
    "requisito": "Se dispone de sistemas de contención para sustancias, materiales y desechos peligrosos en estado líquido.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 20,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-06",
    "requisito": "Los envases están etiquetados correctamente.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 21,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-07",
    "requisito": "No existen envases deteriorados o sin identificación.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 22,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-08",
    "requisito": "El área cuenta con ventilación adecuada.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 23,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-09",
    "requisito": "El área cuenta con sistema contra incendios adecuado al riesgo.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 24,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-10",
    "requisito": "Existe equipo de control de derrames disponible y accesible.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 25,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-11",
    "requisito": "Se cuenta con ducha de emergencia y lavaojos.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 26,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-12",
    "requisito": "El almacenamiento temporal de desechos peligrosos está identificado y controlado.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 27,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-13",
    "requisito": "Se controla el acceso al área de almacenamiento.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 28,
    "activo": true
  },
  {
    "bloque": "Almacenamiento",
    "codigo": "A-14",
    "requisito": "Existe registro actualizado de entrada y salida de materiales/desechos almacenados.",
    "enteRegulador": "Cuerpo de Bomberos / INPSASEL",
    "baseLegal": null,
    "critico": false,
    "orden": 29,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-01",
    "requisito": "El transportista posee autorización vigente para transporte de materiales/desechos peligrosos (Permiso RACDA).",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": "Decreto 2635 (RACDA)",
    "critico": true,
    "orden": 30,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-02",
    "requisito": "Se utiliza guía de despacho con identificación completa (N° ONU, clase de riesgo, designación oficial).",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": null,
    "critico": false,
    "orden": 31,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-03",
    "requisito": "La carga está rotulada y etiquetada conforme clasificación oficial (NTF 3060).",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": "NTF 3060",
    "critico": false,
    "orden": 32,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-04",
    "requisito": "La unidad de transporte porta Guía de Respuesta a Emergencias (COVENIN 3058 / 2670).",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": "COVENIN 3058 / 2670",
    "critico": false,
    "orden": 33,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-05",
    "requisito": "El conductor ha recibido capacitación documentada en manejo de materiales peligrosos (COVENIN 3061).",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": "COVENIN 3061",
    "critico": true,
    "orden": 34,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-06",
    "requisito": "Se mantienen registros de traslado/manifiestos y documentación de entrega/recepción.",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": null,
    "critico": false,
    "orden": 35,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-07",
    "requisito": "Se verifica compatibilidad de la carga antes del despacho.",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": null,
    "critico": false,
    "orden": 36,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-08",
    "requisito": "La unidad cuenta con equipos de emergencia adecuados al tipo de material transportado.",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": null,
    "critico": false,
    "orden": 37,
    "activo": true
  },
  {
    "bloque": "Transporte",
    "codigo": "T-09",
    "requisito": "Existe procedimiento de notificación a la autoridad en caso de accidente durante el transporte.",
    "enteRegulador": "MINEC / INTT",
    "baseLegal": null,
    "critico": false,
    "orden": 38,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-01",
    "requisito": "Existen procedimientos escritos para manipulación segura.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 39,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-02",
    "requisito": "El personal utiliza EPP adecuado al riesgo.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": "LOPCYMAT / COVENIN 2237",
    "critico": false,
    "orden": 40,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-03",
    "requisito": "Se dispone de duchas/lavaojos donde el riesgo lo exige.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 41,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-04",
    "requisito": "Se previene mezcla accidental de sustancias incompatibles.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 42,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-05",
    "requisito": "Existen controles para evitar derrames o fugas.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 43,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-06",
    "requisito": "Se documentan incidentes y acciones correctivas (CAPA).",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 44,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-07",
    "requisito": "El personal conoce y aplica el plan de emergencia/contingencia.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 45,
    "activo": true
  },
  {
    "bloque": "Uso/Manipulación",
    "codigo": "U-08",
    "requisito": "Se realizan inspecciones internas periódicas del manejo de sustancias/materiales peligrosos.",
    "enteRegulador": "INPSASEL (LOPCYMAT)",
    "baseLegal": null,
    "critico": false,
    "orden": 46,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-01",
    "requisito": "La empresa está registrada como generador ante la autoridad ambiental (si aplica).",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "Decreto 2635 (RACDA)",
    "critico": false,
    "orden": 47,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-02",
    "requisito": "Los desechos peligrosos están identificados y etiquetados correctamente.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 48,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-03",
    "requisito": "Existe almacenamiento temporal adecuado para desechos peligrosos.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 49,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-04",
    "requisito": "Se mantiene registro de generación mensual de desechos peligrosos.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 50,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-05",
    "requisito": "Se contrata gestor autorizado para transporte/disposición final (si aplica).",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": true,
    "orden": 51,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-06",
    "requisito": "Se conservan manifiestos y comprobantes de disposición final.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": "Decreto 2635 (RACDA)",
    "critico": false,
    "orden": 52,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-07",
    "requisito": "Se notifican incidentes ambientales asociados a desechos peligrosos cuando corresponda.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 53,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-08",
    "requisito": "No se mezclan desechos peligrosos con no peligrosos.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 54,
    "activo": true
  },
  {
    "bloque": "Generación",
    "codigo": "D-09",
    "requisito": "Existe plan de minimización o reducción de desechos peligrosos.",
    "enteRegulador": "MINEC / RACDA",
    "baseLegal": null,
    "critico": false,
    "orden": 55,
    "activo": true
  }
];

export async function up(queryInterface) {
  const ahora = new Date();

  const existentes = await queryInterface.sequelize.query(
    'SELECT codigo FROM "Requisitos"',
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  const codigos = new Set(existentes.map((requisito) => requisito.codigo));

  const nuevos = REQUISITOS
    .filter((requisito) => !codigos.has(requisito.codigo))
    .map((requisito) => ({
      ...requisito,
      createdAt: ahora,
      updatedAt: ahora,
    }));

  if (nuevos.length > 0) {
    await queryInterface.bulkInsert('Requisitos', nuevos);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Requisitos', {
    codigo: {
      [Sequelize.Op.in]: REQUISITOS.map((requisito) => requisito.codigo),
    },
  });
}
