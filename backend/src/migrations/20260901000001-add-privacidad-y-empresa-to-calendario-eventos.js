export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Eliminar tabla duplicada creada por error
    const tables = await queryInterface.showAllTables({ transaction });
    if (tables.includes('calendario_eventos')) {
      await queryInterface.dropTable('calendario_eventos', { transaction });
    }

    // Agregar columnas a la tabla original CalendarioEventos
    const tableInfo = await queryInterface.describeTable('CalendarioEventos', { transaction });

    if (!tableInfo.privacidad) {
      await queryInterface.addColumn(
        'CalendarioEventos',
        'privacidad',
        {
          type: Sequelize.ENUM('publico', 'privado'),
          allowNull: false,
          defaultValue: 'publico',
        },
        { transaction }
      );
    }

    if (!tableInfo.empresaId) {
      await queryInterface.addColumn(
        'CalendarioEventos',
        'empresaId',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    const tableInfo = await queryInterface.describeTable('CalendarioEventos', { transaction });

    if (tableInfo.empresaId) {
      await queryInterface.removeColumn('CalendarioEventos', 'empresaId', { transaction });
    }

    if (tableInfo.privacidad) {
      await queryInterface.removeColumn('CalendarioEventos', 'privacidad', { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}