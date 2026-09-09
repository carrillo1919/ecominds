export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('EmpresaServicios', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    empresaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Empresas', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    productoId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Productos', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    servicioId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Servicios', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    cantidad: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.0,
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
    precioTotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    fechaEjecucion: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    fechaEntrega: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    estado: {
      type: Sequelize.ENUM('pendiente', 'ejecutado', 'entregado', 'facturado', 'cancelado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    observaciones: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    facturaId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'Facturas', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
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

  await queryInterface.addIndex('EmpresaServicios', ['empresaId'], {
    name: 'empresa_servicios_empresa_idx',
  });
  await queryInterface.addIndex('EmpresaServicios', ['productoId'], {
    name: 'empresa_servicios_producto_idx',
  });
  await queryInterface.addIndex('EmpresaServicios', ['servicioId'], {
    name: 'empresa_servicios_servicio_idx',
  });
  await queryInterface.addIndex('EmpresaServicios', ['facturaId'], {
    name: 'empresa_servicios_factura_idx',
  });

    await queryInterface.sequelize.query(
    `ALTER TABLE "EmpresaServicios" ADD CONSTRAINT "empresa_servicios_tipo_check" CHECK ("productoId" IS NOT NULL OR "servicioId" IS NOT NULL);`,
    { type: Sequelize.QueryTypes.RAW }
  );
};

export const down = async (queryInterface) => {
  await queryInterface.removeConstraint('EmpresaServicios', 'empresa_servicios_tipo_check');
  await queryInterface.removeIndex('EmpresaServicios', 'empresa_servicios_factura_idx');
  await queryInterface.removeIndex('EmpresaServicios', 'empresa_servicios_servicio_idx');
  await queryInterface.removeIndex('EmpresaServicios', 'empresa_servicios_producto_idx');
  await queryInterface.removeIndex('EmpresaServicios', 'empresa_servicios_empresa_idx');
  await queryInterface.dropTable('EmpresaServicios');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_EmpresaServicios_estado";');
};
