export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    nombre: { type: Sequelize.STRING, allowNull: false },
    apellido: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    rol: {
      type: Sequelize.ENUM('admin', 'auditor', 'responsable', 'lector'),
      allowNull: false,
      defaultValue: 'lector',
    },
    verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    verificationToken: { type: Sequelize.STRING, allowNull: true },
    resetPasswordToken: { type: Sequelize.STRING, allowNull: true },
    resetPasswordExpires: { type: Sequelize.DATE, allowNull: true },
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

  await queryInterface.addIndex('Users', ['email'], {
    unique: true,
    name: 'users_email_unique',
  });

  await queryInterface.addIndex('Users', ['verificationToken'], {
    name: 'users_verification_token_idx',
  });

  await queryInterface.addIndex('Users', ['resetPasswordToken'], {
    name: 'users_reset_token_idx',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Users');
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_Users_rol";'
  );
}