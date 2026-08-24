require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
  await sequelize.authenticate();
  app.listen(port, () => {
    console.log(`API escuchando en puerto ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error iniciando servidor:', error);
  process.exit(1);
});
