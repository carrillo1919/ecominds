export async function up(queryInterface, Sequelize) {
  const { DataTypes } = Sequelize;
  const transaction = await queryInterface.sequelize.transaction();

  try {
    const tables = await queryInterface.showAllTables({ transaction });
    if (tables.includes('calendario_eventos')) {
      const tableInfo = await queryInterface.describeTable('calendario_eventos', { transaction });

      if (!tableInfo.privacidad) {
        await queryInterface.addColumn(
          'calendario_eventos',
          'privacidad',
          {
            type: DataTypes.ENUM('publico', 'privado'),
            defaultValue: 'publico',
            allowNull: false,
          },
          { transaction }
        );
      }

      if (!tableInfo.empresa_id) {
        await queryInterface.addColumn(
          'calendario_eventos',
          'empresa_id',
          {
            type: DataTypes.UUID,
            allowNull: true,
          },
          { transaction }
        );
      }

      await transaction.commit();
      return;
    }

    await queryInterface.createTable(
      'calendario_eventos',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        titulo: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        fecha: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        tipo: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'nota',
        },
        color: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        usuario_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        auditoria_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        documento_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        auditoria_item_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        privacidad: {
          type: DataTypes.ENUM('publico', 'privado'),
          allowNull: false,
          defaultValue: 'publico',
        },
        empresa_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tables = await queryInterface.showAllTables({ transaction });
    if (tables.includes('calendario_eventos')) {
      await queryInterface.dropTable('calendario_eventos', { transaction });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}