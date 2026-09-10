export async function up(queryInterface, Sequelize) {
  // Eliminar FK existente hacia Users si existe
  await queryInterface.removeConstraint(
    'Empresas',
    'Empresas_responsable_id_fkey'
  ).catch(() => {});

  // La columna ya existe; aseguramos tipo nullable
  await queryInterface.changeColumn('Empresas', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
  });

  await queryInterface.addConstraint('Empresas', {
    fields: ['responsable_id'],
    type: 'foreign key',
    name: 'Empresas_responsable_id_fkey',
    references: { table: 'Empleados', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint(
    'Empresas',
    'Empresas_responsable_id_fkey'
  ).catch(() => {});

  await queryInterface.changeColumn('Empresas', 'responsable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addConstraint('Empresas', {
    fields: ['responsable_id'],
    type: 'foreign key',
    name: 'Empresas_responsable_id_fkey',
    references: { table: 'Users', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }).catch(() => {});
}
