export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ArchivosAdjuntos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    documento_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Documentos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    nombre_archivo: { type: Sequelize.STRING, allowNull: false },
    contenido: { type: Sequelize.BLOB, allowNull: false },
    tipo_mime: { type: Sequelize.STRING, allowNull: true },
    tamano: { type: Sequelize.INTEGER, allowNull: true },
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

  await queryInterface.addIndex('ArchivosAdjuntos', ['documento_id'], { name: 'archivos_adjuntos_documento_id_idx' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ArchivosAdjuntos');
}
