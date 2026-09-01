const TIPOS_EVENTO = ['auditoria', 'nota', 'documento', 'compromiso'];

const CalendarioEventoModel = (sequelize, DataTypes) => {
  const CalendarioEvento = sequelize.define(
    'CalendarioEvento',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      titulo: { type: DataTypes.STRING, allowNull: false },
      descripcion: DataTypes.TEXT,
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      tipo: {
        type: DataTypes.STRING(50),
        defaultValue: 'nota',
      },
      color: DataTypes.STRING,
      usuarioId: DataTypes.UUID,
      auditoriaId: DataTypes.UUID,
      documentoId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'documento_id',
      },
      auditoriaItemId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'auditoria_item_id',
      },

      // Privacidad de la nota
      privacidad: {
        type: DataTypes.ENUM('publico', 'privado'),
        defaultValue: 'publico',
      },

      // Empresa asociada a la nota (null = todas las empresas)
      empresaId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'CalendarioEventos',
      timestamps: true,
    }
  );

  CalendarioEvento.associate = (models) => {
    CalendarioEvento.belongsTo(models.User, { as: 'usuario', foreignKey: 'usuarioId' });
    CalendarioEvento.belongsTo(models.Auditoria, { as: 'auditoria', foreignKey: 'auditoriaId' });
    CalendarioEvento.belongsTo(models.Empresa, { as: 'empresa', foreignKey: 'empresaId' });
    CalendarioEvento.belongsTo(models.Documento, { foreignKey: 'documento_id', as: 'documento' });
    CalendarioEvento.belongsTo(models.AuditoriaItem, { foreignKey: 'auditoria_item_id', as: 'auditoriaItem' });
  };

  CalendarioEvento.TIPOS = TIPOS_EVENTO;

  return CalendarioEvento;
};

export default CalendarioEventoModel;