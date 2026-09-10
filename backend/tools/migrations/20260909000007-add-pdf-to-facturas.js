export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Facturas', 'pdfNombreArchivo', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
  await queryInterface.addColumn('Facturas', 'pdfContenido', {
    type: Sequelize.BLOB('long'),
    allowNull: true,
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeColumn('Facturas', 'pdfContenido');
  await queryInterface.removeColumn('Facturas', 'pdfNombreArchivo');
};