export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableInfo = await queryInterface.describeTable('CalendarioEventos', { transaction });

    if (!tableInfo.empresaServicioId) {
      await queryInterface.addColumn(
        'CalendarioEventos',
        'empresaServicioId',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );
    }

    await queryInterface.addIndex('CalendarioEventos', ['empresaServicioId'], {
      name: 'calendario_eventos_empresa_servicio_idx',
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeIndex('CalendarioEventos', 'calendario_eventos_empresa_servicio_idx', { transaction });
    const tableInfo = await queryInterface.describeTable('CalendarioEventos', { transaction });
    if (tableInfo.empresaServicioId) {
      await queryInterface.removeColumn('CalendarioEventos', 'empresaServicioId', { transaction });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
