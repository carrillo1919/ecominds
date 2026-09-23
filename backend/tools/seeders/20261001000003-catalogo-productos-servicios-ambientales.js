'use strict';

import { QueryTypes } from 'sequelize';

/**
 * Catálogo ambiental de demo.
 * Columnas reales: codigo, nombre, descripcion, precio, activo,
 *                  unidadMedida, impuesto, createdAt, updatedAt
 * NO existen: moneda, categoria, tipo, estado
 */

function inferirUnidadMedida(nombre = '') {
  const n = nombre.toLowerCase();
  if (/(caja|kit|paquete|set)/.test(n)) return 'caja';
  if (/(par|guantes|botas|zapatos)/.test(n)) return 'par';
  if (/(metro|m2|m3|rollo|filtro|manguera)/.test(n)) return 'metro';
  if (/(litro|galón|galon|bidón|bidon|combustible|aceite)/.test(n)) return 'litro';
  if (/(kg|kilo|tonelada|saco)/.test(n)) return 'kg';
  if (/(hora|servicio|consultoría|consultoria|auditoría|auditoria|estudio|informe|muestreo)/.test(n)) return 'servicio';
  return 'unidad';
}

function inferirImpuesto(codigo = '') {
  // Servicios profesionales y consultoría son exentos en Venezuela (IVA 0%)
  return codigo.startsWith('SRV-') ? 0 : 16;
}

/* ------------------------------------------------------------------ */
/* Datos                                                               */
/* ------------------------------------------------------------------ */

const PRODUCTOS = [
  // --- INS: insumos y equipos ambientales ---
  { codigo: 'INS-001', nombre: 'Filtro de aceite industrial',                 descripcion: 'Filtro para separación de aceites y grasas en sistemas de tratamiento.',                 precio: 45.00,  unidadMedida: 'unidad' },
  { codigo: 'INS-002', nombre: 'Filtro de aire para compresor',               descripcion: 'Cartucho filtrante de repuesto para compresores industriales.',                           precio: 38.50,  unidadMedida: 'unidad' },
  { codigo: 'INS-003', nombre: 'Kit antiderrame de hidrocarburos',            descripcion: 'Kit portátil con absorbentes, pala, bolsas y guantes para derrames de hasta 20 L.',      precio: 185.00, unidadMedida: 'kit' },
  { codigo: 'INS-004', nombre: 'Absorbente universal para derrames',          descripcion: 'Material absorbente de alta capacidad para líquidos industriales.',                       precio: 32.00,  unidadMedida: 'kg' },
  { codigo: 'INS-005', nombre: 'Bolsas industriales para desechos peligrosos', descripcion: 'Bolsas calibre 300 resistentes a solventes, rótulo biohazard.',                          precio: 12.50,  unidadMedida: 'paquete' },
  { codigo: 'INS-006', nombre: 'Contenedor de residuos peligrosos',           descripcion: 'Bidón de 200 L con tapa y cierre hermético, resistente a corrosión.',                    precio: 210.00, unidadMedida: 'unidad' },
  { codigo: 'INS-007', nombre: 'Rotulación de seguridad industrial',          descripcion: 'Señalización según normas COVENIN para áreas de riesgo.',                                 precio: 8.90,   unidadMedida: 'unidad' },
  { codigo: 'INS-008', nombre: 'Kit de bioseguridad básico',                  descripcion: 'Insumos de contención para laboratorio y áreas de riesgo biológico.',                    precio: 145.00, unidadMedida: 'kit' },
  { codigo: 'INS-009', nombre: 'Trampa de grasas prefabricada',               descripcion: 'Separador de grasas para aguas residuales de cocina industrial.',                        precio: 420.00, unidadMedida: 'unidad' },
  { codigo: 'INS-010', nombre: 'Geotextil no tejido',                         descripcion: 'Membrana de refuerzo para obras de contención y drenaje.',                                precio: 6.80,   unidadMedida: 'm2' },

  // --- EPP: equipos de protección personal ---
  { codigo: 'EPP-001', nombre: 'Guantes de nitrilo industrial',               descripcion: 'Guantes anti-químicos sin polvo, talla ajustable.',                                       precio: 9.50,   unidadMedida: 'par' },
  { codigo: 'EPP-002', nombre: 'Botas de seguridad dieléctricas',             descripcion: 'Calzado de seguridad con puntera y suela dieléctrica.',                                   precio: 68.00,  unidadMedida: 'par' },
  { codigo: 'EPP-003', nombre: 'Casco de seguridad con barbuquejo',           descripcion: 'Casco dieléctrico clase B con barbuquejo y suspensión ajustable.',                        precio: 24.00,  unidadMedida: 'unidad' },
  { codigo: 'EPP-004', nombre: 'Lentes de seguridad antiimpacto',             descripcion: 'Protección ocular con recubrimiento antiempañante.',                                      precio: 11.80,  unidadMedida: 'unidad' },
  { codigo: 'EPP-005', nombre: 'Respirador media cara con filtros',           descripcion: 'Respirador de doble cartucho con filtros para vapores orgánicos y partículas.',           precio: 74.00,  unidadMedida: 'unidad' },
  { codigo: 'EPP-006', nombre: 'Chaleco reflectivo de alta visibilidad',      descripcion: 'Chaleco con cintas reflectivas certificadas para trabajos nocturnos.',                    precio: 16.50,  unidadMedida: 'unidad' },

  // --- SEG: seguridad contra incendios ---
  { codigo: 'SEG-001', nombre: 'Extintor PQS 20 lb',                          descripcion: 'Extintor de polvo químico seco, clase ABC, con manómetro y manguera.',                   precio: 95.00,  unidadMedida: 'unidad' },
  { codigo: 'SEG-002', nombre: 'Gabinete para extintor',                      descripcion: 'Gabinete metálico con vidrio y señalización, para exteriores.',                           precio: 78.00,  unidadMedida: 'unidad' },
  { codigo: 'SEG-003', nombre: 'Señalización fotoluminiscente de evacuación', descripcion: 'Rutas y salidas según norma COVENIN 187, visible sin luz.',                               precio: 13.20,  unidadMedida: 'unidad' },
  { codigo: 'SEG-004', nombre: 'Lámpara de emergencia LED',                   descripcion: 'Equipo autónomo de iluminación de emergencia con batería recargable.',                    precio: 42.00,  unidadMedida: 'unidad' },

  // --- QUI: productos químicos ---
  { codigo: 'QUI-001', nombre: 'Detergente industrial biodegradable',         descripcion: 'Formulación biodegradable para limpieza de equipos y superficies industriales.',          precio: 27.50,  unidadMedida: 'litro' },
  { codigo: 'QUI-002', nombre: 'Neutralizador de derrames ácidos',            descripcion: 'Compuesto alcalino para neutralizar derrames de ácidos minerales.',                       precio: 34.00,  unidadMedida: 'kg' },
  { codigo: 'QUI-003', nombre: 'Biocida para sistemas de enfriamiento',       descripcion: 'Tratamiento microbicida para torres de enfriamiento y circuitos cerrados.',               precio: 58.00,  unidadMedida: 'litro' },

  // --- MED: medición y monitoreo ---
  { codigo: 'MED-001', nombre: 'Medidor de pH portátil',                      descripcion: 'pH-metro digital con calibración automática y electrodo reemplazable.',                   precio: 245.00, unidadMedida: 'unidad' },
  { codigo: 'MED-002', nombre: 'Sonómetro digital clase 2',                   descripcion: 'Medición de ruido ambiental con registro de datos y certificación.',                      precio: 380.00, unidadMedida: 'unidad' },
];

const SERVICIOS = [
  { codigo: 'SRV-001', nombre: 'Consultoría en gestión ambiental',                    descripcion: 'Asesoría integral en normativa ambiental y cumplimiento normativo.',                    precio: 950.00 },
  { codigo: 'SRV-002', nombre: 'Estudio de Impacto Ambiental y Socio-cultural (EIA)', descripcion: 'Elaboración del EIA según Ley Orgánica del Ambiente y su reglamento.',                  precio: 4200.00 },
  { codigo: 'SRV-003', nombre: 'Auditoría ambiental',                                 descripcion: 'Auditoría de cumplimiento legal y desempeño ambiental.',                                precio: 1850.00 },
  { codigo: 'SRV-004', nombre: 'Elaboración de Plan de Manejo Ambiental',             descripcion: 'PMA con programa de seguimiento, mitigación y monitoreo.',                              precio: 2400.00 },
  { codigo: 'SRV-005', nombre: 'Caracterización de efluentes líquidos',               descripcion: 'Muestreo y análisis físico-químico de aguas residuales con laboratorio acreditado.',   precio: 780.00 },
  { codigo: 'SRV-006', nombre: 'Muestreo y análisis de calidad de aire',              descripcion: 'Monitoreo de partículas, gases y vapores en ambiente laboral y ambiental.',            precio: 920.00 },
  { codigo: 'SRV-007', nombre: 'Monitoreo de emisiones atmosféricas',                 descripcion: 'Medición de material particulado, SO2, NOx y CO en chimeneas según Decreto 638.',      precio: 1450.00 },
  { codigo: 'SRV-008', nombre: 'Estudio de ruido ambiental y ocupacional',            descripcion: 'Medición de niveles de presión sonora con sonómetro calibrado y mapa de ruido.',        precio: 650.00 },
  { codigo: 'SRV-009', nombre: 'Análisis de calidad de agua potable',                 descripcion: 'Análisis fisicoquímico y bacteriológico según Normas COVENIN.',                        precio: 480.00 },
  { codigo: 'SRV-010', nombre: 'Análisis de suelos y sedimentos',                     descripcion: 'Caracterización de metales pesados, pH, conductividad y nutrientes.',                   precio: 890.00 },
  { codigo: 'SRV-011', nombre: 'Gestión integral de residuos peligrosos',             descripcion: 'Caracterización, inventario y plan de manejo de desechos peligrosos.',                  precio: 1600.00 },
  { codigo: 'SRV-012', nombre: 'Manifiesto de transporte de desechos peligrosos',     descripcion: 'Trámite y registro del manifiesto ante MINEC.',                                        precio: 420.00 },
  { codigo: 'SRV-013', nombre: 'Elaboración del RACDA',                               descripcion: 'Registro de Actividades Capaces de Degradar el Ambiente ante MINEC.',                   precio: 1980.00 },
  { codigo: 'SRV-014', nombre: 'Asesoría para permisos MINEC',                        descripcion: 'Acompañamiento técnico para permisos de afectación, efluentes y emisiones.',            precio: 1350.00 },
  { codigo: 'SRV-015', nombre: 'Formación en seguridad y salud laboral',              descripcion: 'Programa de capacitación LOPCYMAT para trabajadores y delegados.',                      precio: 520.00 },
  { codigo: 'SRV-016', nombre: 'Elaboración del PSST',                                descripcion: 'Programa de Seguridad y Salud en el Trabajo según LOPCYMAT.',                           precio: 2800.00 },
  { codigo: 'SRV-017', nombre: 'Notificación de riesgos por puesto de trabajo',       descripcion: 'Identificación, evaluación y notificación de riesgos al trabajador.',                   precio: 640.00 },
  { codigo: 'SRV-018', nombre: 'Conformación del Comité de Seguridad y Salud',        descripcion: 'Asesoría para constitución, elección y registro del CSSL.',                              precio: 780.00 },
  { codigo: 'SRV-019', nombre: 'Análisis de riesgos y estudio de Protección Civil',   descripcion: 'Evaluación de amenazas, vulnerabilidades y plan de mitigación.',                        precio: 2100.00 },
  { codigo: 'SRV-020', nombre: 'Elaboración de Plan de Emergencias y Evacuación',     descripcion: 'Plan de evacuación, rutas, brigadas y señalización.',                                   precio: 1650.00 },
  { codigo: 'SRV-021', nombre: 'Ejecución de simulacros de evacuación',               descripcion: 'Simulacro documentado con informe de resultados y lecciones aprendidas.',              precio: 590.00 },
  { codigo: 'SRV-022', nombre: 'Inspección de seguridad contra incendios',            descripcion: 'Estudio de carga de fuego y verificación de medios de extinción.',                       precio: 720.00 },
  { codigo: 'SRV-023', nombre: 'Certificación de instalaciones eléctricas',           descripcion: 'Inspección y certificación según COVENIN 200 (Código Eléctrico Nacional).',              precio: 1150.00 },
  { codigo: 'SRV-024', nombre: 'Control integral de plagas',                          descripcion: 'Plan de fumigación y control de roedores con certificado para MPPS.',                   precio: 380.00 },
  { codigo: 'SRV-025', nombre: 'Consultoría para licencia sanitaria',                 descripcion: 'Acompañamiento en trámite de permiso sanitario de funcionamiento.',                     precio: 890.00 },
  { codigo: 'SRV-026', nombre: 'Gestión documental ante SUNDDE',                      descripcion: 'Elaboración y registro de estructura de costos y precios justos.',                      precio: 760.00 },
  { codigo: 'SRV-027', nombre: 'Elaboración de Fichas de Datos de Seguridad (FDS)',   descripcion: 'FDS conforme a norma COVENIN 3059 para sustancias químicas.',                           precio: 420.00 },
];

/* ------------------------------------------------------------------ */
/* UP                                                                  */
/* ------------------------------------------------------------------ */

export const up = async (queryInterface) => {
  const { sequelize } = queryInterface;

  // 1) Productos (idempotente por codigo)
  for (const p of PRODUCTOS) {
    await sequelize.query(
      `INSERT INTO "Productos"
         (id, codigo, nombre, descripcion, precio, activo,
          "unidadMedida", impuesto, "createdAt", "updatedAt")
       VALUES
         (gen_random_uuid(), :codigo, :nombre, :descripcion, :precio, true,
          :unidadMedida, :impuesto, NOW(), NOW())
       ON CONFLICT (codigo) DO NOTHING`,
      {
        replacements: {
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion ?? null,
          precio: p.precio,
          unidadMedida: p.unidadMedida ?? inferirUnidadMedida(p.nombre),
          impuesto: p.impuesto ?? inferirImpuesto(p.codigo),
        },
        type: QueryTypes.INSERT,
      }
    );
  }

  // 2) Servicios (idempotente por codigo)
  for (const s of SERVICIOS) {
    await sequelize.query(
      `INSERT INTO "Servicios"
         (id, codigo, nombre, descripcion, precio, activo,
          "unidadMedida", impuesto, "createdAt", "updatedAt")
       VALUES
         (gen_random_uuid(), :codigo, :nombre, :descripcion, :precio, true,
          :unidadMedida, :impuesto, NOW(), NOW())
       ON CONFLICT (codigo) DO NOTHING`,
      {
        replacements: {
          codigo: s.codigo,
          nombre: s.nombre,
          descripcion: s.descripcion ?? null,
          precio: s.precio,
          unidadMedida: s.unidadMedida ?? inferirUnidadMedida(s.nombre),
          impuesto: s.impuesto ?? inferirImpuesto(s.codigo),
        },
        type: QueryTypes.INSERT,
      }
    );
  }

  const [prods] = await sequelize.query(`SELECT count(*)::int AS n FROM "Productos"`, { type: QueryTypes.SELECT });
  const [servs] = await sequelize.query(`SELECT count(*)::int AS n FROM "Servicios"`, { type: QueryTypes.SELECT });
  console.log(`[catalogo] Productos: ${prods.n}, Servicios: ${servs.n}`);
};

/* ------------------------------------------------------------------ */
/* DOWN                                                                */
/* ------------------------------------------------------------------ */

export const down = async (queryInterface) => {
  const { sequelize } = queryInterface;
  await sequelize.query(`DELETE FROM "Productos" WHERE codigo LIKE 'INS-%' OR codigo LIKE 'EPP-%' OR codigo LIKE 'SEG-%' OR codigo LIKE 'QUI-%' OR codigo LIKE 'MED-%'`);
  await sequelize.query(`DELETE FROM "Servicios" WHERE codigo LIKE 'SRV-%'`);
};