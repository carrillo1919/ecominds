export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('DocumentoAuditoriaLogs', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    documento_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Documentos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    empleado_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Empleados', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    empresa_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    accion: {
      type: Sequelize.ENUM('creado', 'editado', 'eliminado'),
      allowNull: false,
    },
    detalle: { type: Sequelize.JSONB, allowNull: true },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
  });

  await queryInterface.addIndex('DocumentoAuditoriaLogs', ['documento_id'], { name: 'doc_audit_log_documento_id_idx' });
  await queryInterface.addIndex('DocumentoAuditoriaLogs', ['empresa_id'], { name: 'doc_audit_log_empresa_id_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('DocumentoAuditoriaLogs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DocumentoAuditoriaLogs_accion";');
}
