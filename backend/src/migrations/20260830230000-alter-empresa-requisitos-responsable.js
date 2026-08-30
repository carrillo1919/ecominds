export async function up(queryInterface, Sequelize) {
  // Quitar la FK anterior hacia Users si existe
  await queryInterface.removeConstraint(
    'empresa_requisitos',
    'empresa_requisitos_responsable_id_fkey'
  ).catch(() => {});

  // Cambiar el tipo/validez de la columna responsable_id: ahora apunta a Empleados
  await queryInterface.changeColumn('empresa_requisitos', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Empleados', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint(
    'empresa_requisitos',
    'empresa_requisitos_responsable_id_fkey'
  ).catch(() => {});

  await queryInterface.changeColumn('empresa_requisitos', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
