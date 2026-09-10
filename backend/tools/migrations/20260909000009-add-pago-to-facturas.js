export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Facturas', 'fechaPago', {
    type: Sequelize.DATEONLY,
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'metodoPago', {
    type: Sequelize.ENUM('transferencia', 'pago_movil', 'efectivo', 'usd'),
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'referenciaPago', {
    type: Sequelize.STRING(100),
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'bancoPago', {
    type: Sequelize.STRING(150),
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'telefonoPago', {
    type: Sequelize.STRING(30),
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'montoPago', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: true,
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeColumn('Facturas', 'montoPago');
  await queryInterface.removeColumn('Facturas', 'telefonoPago');
  await queryInterface.removeColumn('Facturas', 'bancoPago');
  await queryInterface.removeColumn('Facturas', 'referenciaPago');
  await queryInterface.removeColumn('Facturas', 'metodoPago');
  await queryInterface.removeColumn('Facturas', 'fechaPago');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Facturas_metodoPago";');
};