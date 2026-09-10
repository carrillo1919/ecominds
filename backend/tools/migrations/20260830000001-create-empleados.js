export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Empleados', {
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
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    nombre: { type: Sequelize.STRING, allowNull: false },
    apellido: { type: Sequelize.STRING, allowNull: false },
    cedula: { type: Sequelize.STRING, allowNull: false, unique: true },
    cargo: { type: Sequelize.STRING, allowNull: true },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

  await queryInterface.addIndex('Empleados', ['empresa_id'], { name: 'empleados_empresa_id_idx' });
  await queryInterface.addIndex('Empleados', ['cedula'], { unique: true, name: 'empleados_cedula_unique' });
  await queryInterface.addIndex('Empleados', ['email'], { unique: true, name: 'empleados_email_unique' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Empleados');
}
