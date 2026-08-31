import bcrypt from 'bcrypt';
import { QueryTypes } from 'sequelize';

const SALT_ROUNDS = 10;

const usuarios = [
  { nombre: 'Administrador', email: 'carloscarrillo119@gmail.com', password: 'Cacn1911.', rol: 'admin' },
  { nombre: 'Auditor', email: 'auditor@srcd.local', password: 'Cacn1911.', rol: 'auditor' },
  { nombre: 'Responsable', email: 'responsable@srcd.local', password: 'Cacn1911.', rol: 'responsable' },
  { nombre: 'Lector', email: 'lector@srcd.local', password: 'Cacn1911.', rol: 'lector' },
];

export const up = async (queryInterface) => {
  const existing = await queryInterface.sequelize.query(
    `SELECT email FROM "Users" WHERE email IN (:emails)`,
    { type: QueryTypes.SELECT, replacements: { emails: usuarios.map((u) => u.email) } }
  );
  const existingEmails = new Set(existing.map((e) => e.email));

  const toInsert = [];
  for (const u of usuarios) {
    if (existingEmails.has(u.email)) continue;
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    toInsert.push({
      id: queryInterface.sequelize.literal('gen_random_uuid()'),
      nombre: u.nombre,
      email: u.email,
      password: hash,
      rol: u.rol,
      email_verificado: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  if (toInsert.length > 0) {
    await queryInterface.bulkInsert('Users', toInsert, {});
  }
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete(
    'Users',
    { email: usuarios.map((u) => u.email) },
    {}
  );
};
