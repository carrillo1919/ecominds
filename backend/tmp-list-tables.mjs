import sequelize from './src/config/database.js';
const [tables] = await sequelize.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
);
console.log('Tables found:', tables.length);
console.log(tables.map(t => t.table_name).join('\n'));

const [migrations] = await sequelize.query('SELECT * FROM "SequelizeMeta";');
console.log('\nMigrations recorded:', migrations.length);
migrations.forEach(m => console.log(m.name));

await sequelize.close();
