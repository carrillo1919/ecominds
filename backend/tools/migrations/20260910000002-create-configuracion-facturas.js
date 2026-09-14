export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('ConfiguracionFacturas', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
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
    activo: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

  await queryInterface.addIndex('ConfiguracionFacturas', ['tipo'], {
    name: 'configuracion_facturas_tipo_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('ConfiguracionFacturas', 'configuracion_facturas_tipo_idx');
  await queryInterface.dropTable('ConfiguracionFacturas');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ConfiguracionFacturas_tipo";');
};
