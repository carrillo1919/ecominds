const tablas = ['Productos', 'Servicios', 'EmpresaServicios'];

export async function up(queryInterface, Sequelize) {
  for (const tabla of tablas) {
    const columnas = await queryInterface.describeTable(tabla);
    if (!columnas.impuesto) {
      await queryInterface.addColumn(tabla, 'impuesto', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  }
}

export async function down(queryInterface) {
  for (const tabla of tablas) {
    const columnas = await queryInterface.describeTable(tabla);
    if (columnas.impuesto) {
      await queryInterface.removeColumn(tabla, 'impuesto');
    }
  }
}
