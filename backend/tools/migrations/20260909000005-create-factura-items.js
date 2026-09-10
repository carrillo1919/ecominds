export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('FacturaItems', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    facturaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Facturas', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    empresaServicioId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'EmpresaServicios', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    descripcion: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    cantidad: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    precioUnitario: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    impuesto: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    subtotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
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

  await queryInterface.addIndex('FacturaItems', ['facturaId'], {
    name: 'factura_items_factura_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('FacturaItems', 'factura_items_factura_idx');
  await queryInterface.dropTable('FacturaItems');
};
