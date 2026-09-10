export async function up(queryInterface) {
  await queryInterface.removeConstraint(
    'empresa_requisitos',
    'empresa_requisitos_responsable_id_fkey'
  ).catch(() => {});

  await queryInterface.removeColumn('empresa_requisitos', 'responsable_id');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('empresa_requisitos', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Empleados', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
