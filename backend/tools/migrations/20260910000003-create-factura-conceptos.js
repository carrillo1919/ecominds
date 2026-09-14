export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('FacturaConceptos', {
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
    configuracionId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'ConfiguracionFacturas', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    tipo: {
      type: Sequelize.ENUM('impuesto', 'descuento'),
      allowNull: false,
    },
    nombre: {
      type: Sequelize.STRING(150),
      allowNull: false,
    },
    porcentaje: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    descripcion: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    monto: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
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

  await queryInterface.addIndex('FacturaConceptos', ['facturaId'], {
    name: 'factura_conceptos_factura_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('FacturaConceptos', 'factura_conceptos_factura_idx');
  await queryInterface.dropTable('FacturaConceptos');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_FacturaConceptos_tipo";');
};
