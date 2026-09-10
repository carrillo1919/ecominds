export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Productos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    precio: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    impuesto: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
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

  await queryInterface.addIndex('Productos', ['codigo'], {
    name: 'productos_codigo_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('Productos', 'productos_codigo_idx');
  await queryInterface.dropTable('Productos');
};
