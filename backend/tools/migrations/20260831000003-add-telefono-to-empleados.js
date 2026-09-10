export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Empleados', 'telefono', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Empleados', 'telefono');
}
