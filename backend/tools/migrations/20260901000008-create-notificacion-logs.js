

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notificacion_logs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: Sequelize.ENUM('documento_vencimiento', 'auditoria', 'documento_cargado', 'auditoria_finalizada'), allowNull: false },
    referenciaId: { type: Sequelize.INTEGER, allowNull: false },
    rangoDias: { type: Sequelize.INTEGER, allowNull: true },
    destinatario: { type: Sequelize.STRING, allowNull: false },
    asunto: { type: Sequelize.STRING, allowNull: false },
    cuerpo: { type: Sequelize.TEXT, allowNull: false },
    estado: { type: Sequelize.ENUM('enviado', 'fallido'), defaultValue: 'enviado' },
    error: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('notificacion_logs');
}