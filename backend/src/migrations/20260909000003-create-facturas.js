export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Facturas', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    numero: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    },
    empresaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Empresas', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    fechaEmision: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    fechaVencimiento: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    subtotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    impuesto: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    estado: {
      type: Sequelize.ENUM('borrador', 'emitida', 'pagada', 'anulada'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    notas: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('Facturas', ['numero'], {
    name: 'facturas_numero_idx',
  });
  await queryInterface.addIndex('Facturas', ['empresaId'], {
    name: 'facturas_empresa_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('Facturas', 'facturas_empresa_idx');
  await queryInterface.removeIndex('Facturas', 'facturas_numero_idx');
  await queryInterface.dropTable('Facturas');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Facturas_estado";');
};
