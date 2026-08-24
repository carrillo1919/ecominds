const ESTADOS_AUDITORIA = ['borrador', 'finalizada'];
const NIVELES_RIESGO = ['BAJO', 'MEDIO', 'ALTO'];

const AuditoriaModel = (sequelize, DataTypes) => {
  const Auditoria = sequelize.define(
    'Auditoria',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      empresaId: { type: DataTypes.UUID, allowNull: false },
      auditorId: { type: DataTypes.UUID, allowNull: false },
      codigo: { type: DataTypes.STRING, allowNull: true },
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      fechaProximaAuditoria: { type: DataTypes.DATEONLY, allowNull: true },
      alcance: { type: DataTypes.TEXT, allowNull: true },
      conclusiones: { type: DataTypes.TEXT, allowNull: true },
      estado: { type: DataTypes.ENUM(...ESTADOS_AUDITORIA), allowNull: false, defaultValue: 'borrador' },
      totalRequisitos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalCumple: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalNoCumple: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      totalNoAplica: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      porcentajeCumplimiento: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      porcentajeNoCumplimiento: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      nivelRiesgo: { type: DataTypes.ENUM(...NIVELES_RIESGO), allowNull: false, defaultValue: 'BAJO' },
      riesgoEscalado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      resumen: { type: DataTypes.JSONB, allowNull: true },
      finalizadaEn: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'Auditorias', timestamps: true }
  );

  Auditoria.ESTADOS = ESTADOS_AUDITORIA;
  Auditoria.NIVELES_RIESGO = NIVELES_RIESGO;

  Auditoria.associate = (db) => {
    Auditoria.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    Auditoria.belongsTo(db.User, { foreignKey: 'auditorId', as: 'auditor' });
    Auditoria.hasMany(db.AuditoriaItem, { foreignKey: 'auditoriaId', as: 'items', onDelete: 'CASCADE' });
  };

  return Auditoria;
};

export default AuditoriaModel;
