import { QueryTypes } from 'sequelize';

const requisitos = [
  { sigla: 'SIN', codigo: 'SIN-IVA-01', titulo: 'Declaración mensual del IVA', descripcion: 'Presentación del formulario 200 de IVA dentro del plazo por terminación de NIT.', norma_respaldo: 'Ley 843 art. 10', categoria: 'Tributario', periodicidad: 'mensual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SIN', codigo: 'SIN-IT-02', titulo: 'Declaración mensual del IT', descripcion: 'Formulario 400 del Impuesto a las Transacciones.', norma_respaldo: 'Ley 843 art. 72', categoria: 'Tributario', periodicidad: 'mensual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SIN', codigo: 'SIN-IUE-03', titulo: 'Declaración anual del IUE', descripcion: 'Formulario 500 con estados financieros auditados.', norma_respaldo: 'Ley 843 art. 36', categoria: 'Tributario', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'SIN', codigo: 'SIN-LCV-04', titulo: 'Libro de compras y ventas', descripcion: 'Envío mensual del registro de compras y ventas IVA.', norma_respaldo: 'RND 102000000011', categoria: 'Tributario', periodicidad: 'mensual', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'SIN', codigo: 'SIN-FAC-05', titulo: 'Facturación en línea', descripcion: 'Emisión de facturas mediante modalidad en línea autorizada.', norma_respaldo: 'RND 102100000011', categoria: 'Tributario', periodicidad: 'unica', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MTEPS', codigo: 'MT-PLA-01', titulo: 'Planillas trimestrales de sueldos', descripcion: 'Declaración trimestral de planillas en oficina virtual.', norma_respaldo: 'RM 218/2015', categoria: 'Laboral', periodicidad: 'trimestral', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MTEPS', codigo: 'MT-RE-02', titulo: 'Registro obligatorio de empleadores', descripcion: 'Actualización anual del ROE.', norma_respaldo: 'RM 872/2012', categoria: 'Laboral', periodicidad: 'anual', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'MTEPS', codigo: 'MT-SEG-03', titulo: 'Programa de seguridad y salud ocupacional', descripcion: 'Aprobación y actualización del programa anual.', norma_respaldo: 'DS 2936', categoria: 'Seguridad ocupacional', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'MTEPS', codigo: 'MT-RIT-04', titulo: 'Reglamento interno de trabajo', descripcion: 'Homologación del reglamento interno vigente.', norma_respaldo: 'LGT art. 4', categoria: 'Laboral', periodicidad: 'unica', criticidad: 'media', vigencia_desde: '2026-01-01' },
  { sigla: 'GAMLP', codigo: 'GM-LF-01', titulo: 'Licencia de funcionamiento municipal', descripcion: 'Obtención y renovación de la licencia de funcionamiento.', norma_respaldo: 'Ley Municipal 012', categoria: 'Municipal', periodicidad: 'anual', criticidad: 'alta', vigencia_desde: '2026-01-01' },
  { sigla: 'GAMLP', codigo: 'GM-PUB-02', titulo: 'Autorización de publicidad exterior', descripcion: 'Permiso para rótulos y publicidad en vía pública.', norma_respaldo: 'Ley Municipal 057', categoria: 'Municipal', periodicidad: 'anual', criticidad: 'baja', vigencia_desde: '2026-01-01' },
  { sigla: 'GAMLP', codigo: 'GM-RES-03', titulo: 'Gestión de residuos sólidos', descripcion: 'Reporte semestral de manejo de residuos.', norma_respaldo: 'Ley Municipal 001', categoria: 'Ambiental', periodicidad: 'semestral', criticidad: 'media', vigencia_desde: '2026-01-01' },
];

export const up = async (queryInterface) => {
  for (const ente of [
    { nombre: 'Servicio de Impuestos Nacionales', sigla: 'SIN', ambito: 'nacional', contacto: 'contacto@sin.gob', sitio_web: 'https://www.impuestos.gob.bo', activo: true },
    { nombre: 'Ministerio de Trabajo, Empleo y Previsión Social', sigla: 'MTEPS', ambito: 'nacional', contacto: 'consultas@mteps.gob', sitio_web: 'https://www.mtilde.gob.bo', activo: true },
    { nombre: 'Gobierno Autónomo Municipal de La Paz', sigla: 'GAMLP', ambito: 'municipal', contacto: 'tramites@lapaz.bo', sitio_web: 'https://www.lapaz.bo', activo: true },
  ]) {
    await queryInterface.sequelize.query(
      `INSERT INTO entes_reguladores (id, nombre, sigla, ambito, contacto, sitio_web, activo, created_at, updated_at)
       VALUES (gen_random_uuid(), :nombre, :sigla, :ambito, :contacto, :sitio_web, :activo, NOW(), NOW())
       ON CONFLICT (sigla) DO NOTHING`,
      { replacements: ente, type: QueryTypes.INSERT }
    );
  }

  const entes = await queryInterface.sequelize.query(
    `SELECT id, sigla FROM entes_reguladores WHERE sigla IN ('SIN', 'MTEPS', 'GAMLP')`,
    { type: QueryTypes.SELECT }
  );
  const bySigla = Object.fromEntries(entes.map((e) => [e.sigla, e.id]));

  const missing = requisitos.filter((r) => !bySigla[r.sigla]);
  if (missing.length > 0) {
    throw new Error(`Entes reguladores no encontrados para: ${missing.map((r) => r.sigla).join(', ')}`);
  }

  for (const r of requisitos) {
    await queryInterface.sequelize.query(
      `INSERT INTO requisitos_legales
        (id, ente_id, codigo, titulo, descripcion, norma_respaldo, categoria, periodicidad, criticidad, vigencia_desde, activo, created_at, updated_at)
       VALUES
        (gen_random_uuid(), :ente_id, :codigo, :titulo, :descripcion, :norma_respaldo, :categoria, :periodicidad, :criticidad, :vigencia_desde, true, NOW(), NOW())
       ON CONFLICT (ente_id, codigo) DO NOTHING`,
      {
        replacements: { ...r, ente_id: bySigla[r.sigla] },
        type: QueryTypes.INSERT,
      }
    );
  }
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.query(
    `DELETE FROM requisitos_legales WHERE codigo IN (${requisitos.map((_, i) => `:codigo${i}`).join(', ')})`,
    { replacements: Object.fromEntries(requisitos.map((r, i) => [`codigo${i}`, r.codigo])), type: QueryTypes.DELETE }
  );
};