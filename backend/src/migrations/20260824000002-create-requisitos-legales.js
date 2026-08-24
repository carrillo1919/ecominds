export const up = async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'periodicidad_requisito') THEN
        CREATE TYPE periodicidad_requisito AS ENUM ('unica', 'mensual', 'trimestral', 'semestral', 'anual');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'criticidad_requisito') THEN
        CREATE TYPE criticidad_requisito AS ENUM ('alta', 'media', 'baja');
      END IF;
    END $$;
  `);

  await queryInterface.createTable('requisitos_legales', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    ente_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'entes_reguladores', key: 'id' }, onDelete: 'RESTRICT' },
    codigo: { type: Sequelize.STRING(40), allowNull: false },
    titulo: { type: Sequelize.STRING(200), allowNull: false },
    descripcion: { type: Sequelize.TEXT },
    norma_respaldo: { type: Sequelize.STRING(200) },
    categoria: { type: Sequelize.STRING(80), allowNull: false },
    periodicidad: { type: 'periodicidad_requisito', allowNull: false, defaultValue: 'anual' },
    criticidad: { type: 'criticidad_requisito', allowNull: false, defaultValue: 'media' },
    vigencia_desde: { type: Sequelize.DATEONLY },
    vigencia_hasta: { type: Sequelize.DATEONLY },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('requisitos_legales', ['ente_id']);
  await queryInterface.addIndex('requisitos_legales', ['categoria']);
  await queryInterface.addConstraint('requisitos_legales', {
    fields: ['ente_id', 'codigo'],
    type: 'unique',
    name: 'requisitos_legales_ente_id_codigo_unique',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('requisitos_legales');
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS periodicidad_requisito;
    DROP TYPE IF EXISTS criticidad_requisito;
  `);
};