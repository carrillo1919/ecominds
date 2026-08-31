import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config({ override: true });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL no está definida');
}

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    family: 4, // Fuerza IPv4
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
