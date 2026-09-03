

export async function up(queryInterface) {
  await queryInterface.bulkInsert('notificacion_configs', [
    {
      tipo: 'documento_vencimiento',
      rangosDias: JSON.stringify([30, 15, 1, 0]),
      horaEnvio: '08:00:00',
      activo: true,
      plantillaAsunto: 'Recordatorio: documento próximo a vencer',
      plantillaCuerpo: '<p>El documento <strong>{{nombre}}</strong> vence el <strong>{{fechaVencimiento}}</strong>.</p>',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      tipo: 'auditoria',
      rangosDias: JSON.stringify([0]),
      horaEnvio: '07:00:00',
      activo: true,
      plantillaAsunto: 'Auditoría programada para hoy',
      plantillaCuerpo: '<p>Hoy se ha programado la auditoría <strong>{{nombre}}</strong>.</p>',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('notificacion_configs', null, {});
}