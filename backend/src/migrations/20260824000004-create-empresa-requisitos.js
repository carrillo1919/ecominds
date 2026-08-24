export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('empresa_requisitos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    empresa_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'Empresas', key: 'id' }, onDelete: 'CASCADE' },
    requisito_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'requisitos_legales', key: 'id' }, onDelete: 'RESTRICT' },
    responsable_id: { type: Sequelize.UUID, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
    fecha_asignacion: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.literal('CURRENT_DATE') },
    observaciones: { type: Sequelize.TEXT },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('empresa_requisitos', ['empresa_id']);
  await queryInterface.addIndex('empresa_requisitos', ['requisito_id']);
  await queryInterface.addConstraint('empresa_requisitos', {
    fields: ['empresa_id', 'requisito_id'],
    type: 'unique',
    name: 'empresa_requisitos_unique',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('empresa_requisitos');
};