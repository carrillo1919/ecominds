const EmpresaAsignacionModel = (sequelize, DataTypes) => {
  const EmpresaAsignacion = sequelize.define('EmpresaAsignacion', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    empresaId: { type: DataTypes.UUID, allowNull: false },
    rolContexto: { type: DataTypes.ENUM('auditor', 'lector'), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'empresa_asignaciones',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'empresa_id'], name: 'empresa_asignaciones_user_empresa_unique' },
    ],
  });

  EmpresaAsignacion.associate = (db) => {
    EmpresaAsignacion.belongsTo(db.User, { foreignKey: 'userId', as: 'usuario' });
    EmpresaAsignacion.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
  };

  return EmpresaAsignacion;
};

export default EmpresaAsignacionModel;
