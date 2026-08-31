export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('CalendarioEventos', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    titulo: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    descripcion: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    fecha: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: Sequelize.ENUM('auditoria', 'nota'),
      allowNull: false,
      defaultValue: 'nota',
    },
    auditoriaId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    usuarioId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    color: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('CalendarioEventos', ['fecha'], {
    name: 'calendario_eventos_fecha_idx',
  });

  // Índice para consultar rápido los compromisos del checklist por fecha.
  await queryInterface.addIndex('AuditoriaItems', ['fechaCompromiso'], {
    name: 'auditoria_items_fecha_compromiso_idx',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeIndex('AuditoriaItems', 'auditoria_items_fecha_compromiso_idx');
  await queryInterface.removeIndex('CalendarioEventos', 'calendario_eventos_fecha_idx');
  await queryInterface.dropTable('CalendarioEventos');
};