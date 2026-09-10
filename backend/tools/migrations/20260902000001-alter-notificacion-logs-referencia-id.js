export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('notificacion_logs', 'referenciaId', {
    type: Sequelize.STRING,
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('notificacion_logs', 'referenciaId', {
    type: Sequelize.INTEGER,
    allowNull: false,
  });
}