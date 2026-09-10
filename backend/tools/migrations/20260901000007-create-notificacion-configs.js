

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notificacion_configs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: Sequelize.ENUM('documento_vencimiento', 'auditoria'), allowNull: false, unique: true },
    rangosDias: { type: Sequelize.JSON, allowNull: false, defaultValue: [30, 15, 1, 0] },
    horaEnvio: { type: Sequelize.TIME, allowNull: false, defaultValue: '08:00:00' },
    activo: { type: Sequelize.BOOLEAN, defaultValue: true },
    plantillaAsunto: { type: Sequelize.STRING, allowNull: true },
    plantillaCuerpo: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('notificacion_configs');
}