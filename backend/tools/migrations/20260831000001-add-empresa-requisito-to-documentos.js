export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Documentos', 'empresa_requisito_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'empresa_requisitos', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('Documentos', ['empresa_requisito_id'], {
    name: 'documentos_empresa_requisito_id_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Documentos', 'documentos_empresa_requisito_id_idx').catch(() => {});
  await queryInterface.removeColumn('Documentos', 'empresa_requisito_id');
}
