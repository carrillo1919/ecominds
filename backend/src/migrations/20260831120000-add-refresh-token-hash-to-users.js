export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Users', 'refresh_token_hash', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Users', 'refresh_token_hash');
}
