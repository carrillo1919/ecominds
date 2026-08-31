const TIPOS_EVENTO = ['auditoria', 'nota', 'documento', 'compromiso'];

const CalendarioEventoModel = (sequelize, DataTypes) => {
  const CalendarioEvento = sequelize.define(
    'CalendarioEvento',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      titulo: { type: DataTypes.STRING(255), allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      tipo: {
        type: DataTypes.STRING(30), // antes ENUM('auditoria','nota')
        allowNull: false,
        defaultValue: 'nota',
      },
      // Referencias a entidades que originan el evento.
      auditoriaId: { type: DataTypes.UUID, allowNull: true },
      documentoId: { type: DataTypes.UUID, allowNull: true, field: 'documento_id' },
      auditoriaItemId: { type: DataTypes.UUID, allowNull: true, field: 'auditoria_item_id' },
      usuarioId: { type: DataTypes.UUID, allowNull: true },
      color: { type: DataTypes.STRING(20), allowNull: true },
    },
    {
      tableName: 'CalendarioEventos',
      timestamps: true,
      indexes: [{ fields: ['fecha'] }],
    }
  );

  CalendarioEvento.TIPOS = TIPOS_EVENTO;

  CalendarioEvento.associate = (db) => {
    CalendarioEvento.belongsTo(db.Auditoria, { foreignKey: 'auditoriaId', as: 'auditoria' });
    CalendarioEvento.belongsTo(db.Documento, { foreignKey: 'documentoId', as: 'documento' });
    CalendarioEvento.belongsTo(db.AuditoriaItem, { foreignKey: 'auditoriaItemId', as: 'auditoriaItem' });
    CalendarioEvento.belongsTo(db.User, { foreignKey: 'usuarioId', as: 'usuario' });
  };

  return CalendarioEvento;
};

export default CalendarioEventoModel;