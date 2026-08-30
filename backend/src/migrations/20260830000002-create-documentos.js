export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Documentos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    empresa_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Empresas', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    responsable_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Empleados', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    titulo: { type: Sequelize.STRING, allowNull: false },
    descripcion: { type: Sequelize.TEXT, allowNull: true },
    fecha_documento: { type: Sequelize.DATEONLY, allowNull: true },
    fecha_vencimiento: { type: Sequelize.DATEONLY, allowNull: false },
    estado: {
      type: Sequelize.ENUM('vigente', 'vencido', 'archivado'),
      allowNull: false,
      defaultValue: 'vigente',
    },
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

  await queryInterface.addIndex('Documentos', ['empresa_id'], { name: 'documentos_empresa_id_idx' });
  await queryInterface.addIndex('Documentos', ['responsable_id'], { name: 'documentos_responsable_id_idx' });
  await queryInterface.addIndex('Documentos', ['estado'], { name: 'documentos_estado_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Documentos');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Documentos_estado";');
}
