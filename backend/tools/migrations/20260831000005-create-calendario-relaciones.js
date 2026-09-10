export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('CalendarioEventos', 'documento_id', {
    type: Sequelize.UUID,
    allowNull: true,
  });
  await queryInterface.addColumn('CalendarioEventos', 'auditoria_item_id', {
    type: Sequelize.UUID,
    allowNull: true,
  });
  await queryInterface.addIndex('CalendarioEventos', ['documento_id']);
  await queryInterface.addIndex('CalendarioEventos', ['auditoria_item_id']);
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('CalendarioEventos', ['auditoria_item_id']);
  await queryInterface.removeIndex('CalendarioEventos', ['documento_id']);
  await queryInterface.removeColumn('CalendarioEventos', 'auditoria_item_id');
  await queryInterface.removeColumn('CalendarioEventos', 'documento_id');
};