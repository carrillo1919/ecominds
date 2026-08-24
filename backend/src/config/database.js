const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';
const logging = false;
const useSsl = process.env.DB_SSL === 'true';
const sslOptions = useSsl
  ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
  : {};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect, logging, ...sslOptions })
  : new Sequelize(
      process.env.DB_NAME || 'srcd',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect,
        logging,
        ...sslOptions
      }
    );

module.exports = sequelize;
