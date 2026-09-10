export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('AuditoriaItems', 'responsable_accion_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Empleados', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  await queryInterface.addIndex('AuditoriaItems', ['responsable_accion_id'], {
    name: 'auditoria_items_responsable_accion_id_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('AuditoriaItems', 'responsable_accion_id');
}
