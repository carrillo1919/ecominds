const EmpresaRequisitoModel = (sequelize, DataTypes) => {
  const EmpresaRequisito = sequelize.define('EmpresaRequisito', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    empresaId: { type: DataTypes.UUID, allowNull: false },
    requisitoId: { type: DataTypes.UUID, allowNull: false },
    fechaAsignacion: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    responsableId: { type: DataTypes.UUID },
    observaciones: DataTypes.TEXT,
  }, { tableName: 'empresa_requisitos', timestamps: true, underscored: true });

  EmpresaRequisito.associate = (db) => {
    EmpresaRequisito.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    EmpresaRequisito.belongsTo(db.RequisitoLegal, { foreignKey: 'requisitoId', as: 'requisito' });
    EmpresaRequisito.belongsTo(db.User, { foreignKey: 'responsableId', as: 'responsable' });
  };

  return EmpresaRequisito;
};

export default EmpresaRequisitoModel;