export const up = async (queryInterface, Sequelize) => {
  // Unidad de medida en productos y servicios (lts, mts, kg, unidad, ...)
  await queryInterface.addColumn('Productos', 'unidadMedida', {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'unidad',
  });
  await queryInterface.addColumn('Servicios', 'unidadMedida', {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'unidad',
  });
  await queryInterface.addColumn('EmpresaServicios', 'unidadMedida', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });
  await queryInterface.addColumn('FacturaItems', 'unidadMedida', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });

  // Descuento (monto en moneda) aplicado a la factura y a cada item
  await queryInterface.addColumn('Facturas', 'descuento', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.0,
  });
  await queryInterface.addColumn('FacturaItems', 'descuento', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.0,
  });

  // Copia la unidad de medida al histórico de asignaciones e items de factura
  await queryInterface.sequelize.query(`
    UPDATE "EmpresaServicios" AS es
    SET "unidadMedida" = p."unidadMedida"
    FROM "Productos" AS p
    WHERE es."productoId" = p.id
  `);
  await queryInterface.sequelize.query(`
    UPDATE "EmpresaServicios" AS es
    SET "unidadMedida" = s."unidadMedida"
    FROM "Servicios" AS s
    WHERE es."servicioId" = s.id
  `);
  await queryInterface.sequelize.query(`
    UPDATE "FacturaItems" AS fi
    SET "unidadMedida" = es."unidadMedida"
    FROM "EmpresaServicios" AS es
    WHERE fi."empresaServicioId" = es.id
  `);

  // El porcentaje de impuesto ya no depende del producto/servicio: se
  // configura en el módulo de configuración de factura.
  await queryInterface.removeColumn('Productos', 'impuesto');
  await queryInterface.removeColumn('Servicios', 'impuesto');
  await queryInterface.removeColumn('EmpresaServicios', 'impuesto');
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Productos', 'impuesto', {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
  });
  await queryInterface.addColumn('Servicios', 'impuesto', {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
  });
  await queryInterface.addColumn('EmpresaServicios', 'impuesto', {
    type: Sequelize.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
  });

  await queryInterface.removeColumn('FacturaItems', 'descuento');
  await queryInterface.removeColumn('Facturas', 'descuento');
  await queryInterface.removeColumn('FacturaItems', 'unidadMedida');
  await queryInterface.removeColumn('EmpresaServicios', 'unidadMedida');
  await queryInterface.removeColumn('Servicios', 'unidadMedida');
  await queryInterface.removeColumn('Productos', 'unidadMedida');
};
