export async function up(queryInterface) {
  await queryInterface.removeIndex('Empleados', 'empleados_cedula_unique').catch(() => {});
  await queryInterface.removeIndex('Empleados', 'empleados_email_unique').catch(() => {});

  await queryInterface.addIndex(
    'Empleados',
    ['empresa_id', 'cedula'],
    { unique: true, name: 'empleados_empresa_cedula_unique' }
  );
  await queryInterface.addIndex(
    'Empleados',
    ['empresa_id', 'email'],
    { unique: true, name: 'empleados_empresa_email_unique' }
  );
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Empleados', 'empleados_empresa_cedula_unique').catch(() => {});
  await queryInterface.removeIndex('Empleados', 'empleados_empresa_email_unique').catch(() => {});
  await queryInterface.removeIndex('Empleados', 'empleados_cedula_unique').catch(() => {});
  await queryInterface.removeIndex('Empleados', 'empleados_email_unique').catch(() => {});

  await queryInterface.addIndex('Empleados', ['cedula'], { unique: true, name: 'empleados_cedula_unique' });
  await queryInterface.addIndex('Empleados', ['email'], { unique: true, name: 'empleados_email_unique' });
}
