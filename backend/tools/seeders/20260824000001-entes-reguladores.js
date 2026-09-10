import { QueryTypes } from 'sequelize';

const entes = [
  { nombre: 'Servicio de Impuestos Nacionales', sigla: 'SIN', ambito: 'nacional', contacto: 'contacto@sin.gob', sitio_web: 'https://www.impuestos.gob.bo', activo: true },
  { nombre: 'Ministerio de Trabajo, Empleo y Previsión Social', sigla: 'MTEPS', ambito: 'nacional', contacto: 'consultas@mteps.gob', sitio_web: 'https://www.mtilde.gob.bo', activo: true },
  { nombre: 'Gobierno Autónomo Municipal de La Paz', sigla: 'GAMLP', ambito: 'municipal', contacto: 'tramites@lapaz.bo', sitio_web: 'https://www.lapaz.bo', activo: true },
];

export const up = async (queryInterface) => {
  for (const ente of entes) {
    await queryInterface.sequelize.query(
      `INSERT INTO entes_reguladores (id, nombre, sigla, ambito, contacto, sitio_web, activo, created_at, updated_at)
       VALUES (gen_random_uuid(), :nombre, :sigla, :ambito, :contacto, :sitio_web, :activo, NOW(), NOW())
       ON CONFLICT (sigla) DO NOTHING`,
      { replacements: ente, type: QueryTypes.INSERT }
    );
  }
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.query(
    `DELETE FROM entes_reguladores WHERE sigla IN ('SIN', 'MTEPS', 'GAMLP')`,
    { type: QueryTypes.DELETE }
  );
};