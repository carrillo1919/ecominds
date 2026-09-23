'use strict';

export const up = async (queryInterface) => {
  const { sequelize } = queryInterface;

  const [rows] = await sequelize.query(
    `SELECT 1 FROM pg_type WHERE typname = 'periodicidad_requisito' LIMIT 1`
  );
  if (rows.length === 0) {
    console.warn('[add-bianual] El tipo "periodicidad_requisito" no existe, se omite.');
    return;
  }

  // PG 12+: permitido en transacción mientras el valor no se use en la misma TX.
  await sequelize.query(
    `ALTER TYPE periodicidad_requisito ADD VALUE IF NOT EXISTS 'bianual'`
  );
};

export const down = async () => {
  // Postgres no permite quitar valores de un enum sin recrear el tipo.
};