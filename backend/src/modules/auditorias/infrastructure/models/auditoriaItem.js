const ESTADOS_ITEM = ['cumple', 'no_cumple', 'na'];

const AuditoriaItemModel = (sequelize, DataTypes) => {
  const AuditoriaItem = sequelize.define(
    'AuditoriaItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      auditoriaId: { type: DataTypes.UUID, allowNull: false },
      requisitoId: { type: DataTypes.UUID, allowNull: false },
      // RF-03.1: Cumple / No cumple / No aplica + hallazgos.
      estado: { type: DataTypes.ENUM(...ESTADOS_ITEM), allowNull: true },
      observaciones: { type: DataTypes.TEXT, allowNull: true },
      // Plan de acciones correctivas (CAPA).
      accionCorrectiva: { type: DataTypes.TEXT, allowNull: true },
      responsableAccion: { type: DataTypes.STRING, allowNull: true },
      responsableAccionId: { type: DataTypes.UUID, allowNull: true, field: 'responsable_accion_id' },
      fechaCompromiso: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      tableName: 'AuditoriaItems',
      timestamps: true,
      indexes: [{ unique: true, fields: ['auditoriaId', 'requisitoId'] }],
    }
  );

  AuditoriaItem.ESTADOS = ESTADOS_ITEM;

  AuditoriaItem.associate = (db) => {
    AuditoriaItem.belongsTo(db.Auditoria, { foreignKey: 'auditoriaId', as: 'auditoria' });
    AuditoriaItem.belongsTo(db.Requisito, { foreignKey: 'requisitoId', as: 'requisito' });
    AuditoriaItem.belongsTo(db.Empleado, { foreignKey: 'responsableAccionId', as: 'responsableEmpleado' });
  };

  return AuditoriaItem;
};

export default AuditoriaItemModel;
