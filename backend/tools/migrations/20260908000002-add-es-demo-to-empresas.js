export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Empresas', 'es_demo', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Empresas', 'es_demo');
}
