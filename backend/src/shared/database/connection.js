import dotenv from 'dotenv';
import fs from 'fs';
import { Sequelize } from 'sequelize';

dotenv.config({ override: true });

const url = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (!url) {
  throw new Error('DATABASE_URL no está definida');
}

const buildSslConfig = () => {
  if (!isProduction) {
    return { require: false, rejectUnauthorized: false };
  }

  if (process.env.PG_CA_CERT) {
    return {
      require: true,
      ca: fs.readFileSync(process.env.PG_CA_CERT),
      rejectUnauthorized: true,
    };
  }

  return {
    require: true,
    rejectUnauthorized: false,
  };
};

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: buildSslConfig(),
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
