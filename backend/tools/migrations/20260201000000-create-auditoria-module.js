export async function up(queryInterface, Sequelize) {
  const timestamps = {
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
  };

  await queryInterface.createTable('Empresas', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    nombre: { type: Sequelize.STRING, allowNull: false },
    rif: { type: Sequelize.STRING, allowNull: false, unique: true },
    sector: { type: Sequelize.STRING, allowNull: true },
    actividad: { type: Sequelize.STRING, allowNull: true },
    direccion: { type: Sequelize.STRING, allowNull: true },
    telefono: { type: Sequelize.STRING, allowNull: true },
    email: { type: Sequelize.STRING, allowNull: true },
    responsable: { type: Sequelize.STRING, allowNull: true },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    ...timestamps,
  });

  await queryInterface.createTable('Requisitos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    bloque: { type: Sequelize.STRING, allowNull: false },
    codigo: { type: Sequelize.STRING, allowNull: false, unique: true },
    requisito: { type: Sequelize.TEXT, allowNull: false },
    enteRegulador: { type: Sequelize.STRING, allowNull: true },
    baseLegal: { type: Sequelize.STRING, allowNull: true },
    critico: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    ...timestamps,
  });

  await queryInterface.createTable('Auditorias', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    empresaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Empresas', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    auditorId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    codigo: { type: Sequelize.STRING, allowNull: true },
    fecha: { type: Sequelize.DATEONLY, allowNull: false },
    fechaProximaAuditoria: { type: Sequelize.DATEONLY, allowNull: true },
    alcance: { type: Sequelize.TEXT, allowNull: true },
    conclusiones: { type: Sequelize.TEXT, allowNull: true },
    estado: {
      type: Sequelize.ENUM('borrador', 'finalizada'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    totalRequisitos: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalCumple: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalNoCumple: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalNoAplica: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    porcentajeCumplimiento: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    porcentajeNoCumplimiento: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    nivelRiesgo: {
      type: Sequelize.ENUM('BAJO', 'MEDIO', 'ALTO'),
      allowNull: false,
      defaultValue: 'BAJO',
    },
    riesgoEscalado: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resumen: { type: Sequelize.JSONB, allowNull: true },
    finalizadaEn: { type: Sequelize.DATE, allowNull: true },
    ...timestamps,
  });

  await queryInterface.createTable('AuditoriaItems', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    auditoriaId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Auditorias', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    requisitoId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'Requisitos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    estado: {
      type: Sequelize.ENUM('cumple', 'no_cumple', 'na'),
      allowNull: true,
    },
    observaciones: { type: Sequelize.TEXT, allowNull: true },
    accionCorrectiva: { type: Sequelize.TEXT, allowNull: true },
    responsableAccion: { type: Sequelize.STRING, allowNull: true },
    fechaCompromiso: { type: Sequelize.DATEONLY, allowNull: true },
    ...timestamps,
  });

  await queryInterface.addIndex(
    'AuditoriaItems',
    ['auditoriaId', 'requisitoId'],
    {
      unique: true,
      name: 'auditoria_items_auditoria_requisito_unique',
    }
  );

  await queryInterface.addIndex('Auditorias', ['empresaId', 'fecha']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('AuditoriaItems');
  await queryInterface.dropTable('Auditorias');
  await queryInterface.dropTable('Requisitos');
  await queryInterface.dropTable('Empresas');

  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_AuditoriaItems_estado";'
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_Auditorias_estado";'
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_Auditorias_nivelRiesgo";'
  );
}