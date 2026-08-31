import { QueryTypes } from 'sequelize';

export const up = async (queryInterface) => {
  const count = await queryInterface.sequelize.query('SELECT COUNT(*) FROM "Empresas"', { type: QueryTypes.SELECT });
  if (Number(count[0].count) > 0) return;

  const users = await queryInterface.sequelize.query(
    `SELECT id FROM "Users" WHERE email = 'responsable@srcd.local'`,
    { type: QueryTypes.SELECT }
  );
  const responsableId = users[0]?.id || null;

  await queryInterface.bulkInsert('Empresas', [
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), nombre: 'Constructora Andina', rif: 'J-102345678', sector: 'Construcción', actividad: 'Construcción civil', email: 'contacto@andina.com', responsable_id: responsableId, activo: true, createdAt: new Date(), updatedAt: new Date() },
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), nombre: 'Alimentos del Valle', rif: 'J-209876543', sector: 'Alimentos', actividad: 'Procesamiento de alimentos', email: 'contacto@valle.com', responsable_id: responsableId, activo: true, createdAt: new Date(), updatedAt: new Date() },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('Empresas', { rif: ['J-102345678', 'J-209876543'] }, {});
};