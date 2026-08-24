export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('entes_reguladores', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    nombre: { type: Sequelize.STRING(160), allowNull: false },
    sigla: { type: Sequelize.STRING(20), allowNull: false, unique: true },
    ambito: { type: Sequelize.ENUM('nacional', 'departamental', 'municipal', 'sectorial'), allowNull: false, defaultValue: 'nacional' },
    contacto: { type: Sequelize.STRING(160) },
    sitio_web: { type: Sequelize.STRING },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false },
    updated_at: { type: Sequelize.DATE, allowNull: false },
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('entes_reguladores');
};