export const up = async (queryInterface, Sequelize) => {
  // 1. Quitar el default que depende del enum
  await queryInterface.sequelize.query(`
    ALTER TABLE "CalendarioEventos"
      ALTER COLUMN "tipo" DROP DEFAULT;
  `);

  // 2. Convertir la columna a VARCHAR(30)
  await queryInterface.sequelize.query(`
    ALTER TABLE "CalendarioEventos"
      ALTER COLUMN "tipo" TYPE VARCHAR(30)
      USING "tipo"::text;
  `);
};

export const down = async (queryInterface, Sequelize) => {
  // Revertir: recrear el enum y reasignar la columna
  await queryInterface.sequelize.query(`
    CREATE TYPE "enum_CalendarioEventos_tipo" AS ENUM ('auditoria', 'nota', 'documento', 'compromiso');
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "CalendarioEventos"
      ALTER COLUMN "tipo" TYPE "enum_CalendarioEventos_tipo"
      USING "tipo"::text::"enum_CalendarioEventos_tipo";
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "CalendarioEventos"
      ALTER COLUMN "tipo" SET DEFAULT 'nota';
  `);
};