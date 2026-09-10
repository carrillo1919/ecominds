export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('empresa_asignaciones', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    empresa_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Empresas', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    rol_contexto: { type: Sequelize.ENUM('auditor', 'lector'), allowNull: false },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('empresa_asignaciones', ['user_id', 'empresa_id'], {
    unique: true,
    name: 'empresa_asignaciones_user_empresa_unique',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('empresa_asignaciones');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_empresa_asignaciones_rol_contexto";');
}
