export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Empresas', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
  });
  await queryInterface.addIndex('Empresas', ['responsable_id']);
};

export const down = async (queryInterface) => {
  await queryInterface.removeColumn('Empresas', 'responsable_id');
};