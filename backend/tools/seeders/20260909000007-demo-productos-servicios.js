import { QueryTypes } from 'sequelize';

export const up = async (queryInterface) => {
  const productosCount = await queryInterface.sequelize.query('SELECT COUNT(*) FROM "Productos"', { type: QueryTypes.SELECT });
  if (Number(productosCount[0].count) > 0) return;

  await queryInterface.bulkInsert('Productos', [
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'PROD-001', nombre: 'Kit de cumplimiento legal', descripcion: 'Paquete de documentos y guías para cumplimiento normativo', precio: 150.00, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'PROD-002', nombre: 'Manual de auditoría', descripcion: 'Manual impreso de auditoría de cumplimiento', precio: 75.50, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'PROD-003', nombre: 'Licencia anual EcoMinds', descripcion: 'Licencia de uso anual de la plataforma EcoMinds', precio: 450.00, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
  ], {});

  const serviciosCount = await queryInterface.sequelize.query('SELECT COUNT(*) FROM "Servicios"', { type: QueryTypes.SELECT });
  if (Number(serviciosCount[0].count) > 0) return;

  await queryInterface.bulkInsert('Servicios', [
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'SERV-001', nombre: 'Auditoría de cumplimiento', descripcion: 'Auditoría integral de requisitos legales y normativos', precio: 1200.00, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'SERV-002', nombre: 'Capacitación en normativa', descripcion: 'Taller de capacitación para personal de la empresa', precio: 350.00, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
    { id: queryInterface.sequelize.literal('gen_random_uuid()'), codigo: 'SERV-003', nombre: 'Consultoría RSE', descripcion: 'Asesoría en responsabilidad social empresarial', precio: 800.00, impuesto: 16.00, activo: true, createdAt: new Date(), updatedAt: new Date() },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('Productos', { codigo: ['PROD-001', 'PROD-002', 'PROD-003'] }, {});
  await queryInterface.bulkDelete('Servicios', { codigo: ['SERV-001', 'SERV-002', 'SERV-003'] }, {});
};
