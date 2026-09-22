export async function up(queryInterface) {
  await queryInterface.removeColumn('Auditorias', 'fechaProximaAuditoria');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('Auditorias', 'fechaProximaAuditoria', {
    type: Sequelize.DATEONLY,
    allowNull: true,
  });
}
