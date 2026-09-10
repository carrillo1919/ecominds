const RequisitoLegalModel = (sequelize, DataTypes) => {
  const RequisitoLegal = sequelize.define('RequisitoLegal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enteId: { type: DataTypes.UUID, allowNull: false },
    codigo: { type: DataTypes.STRING(40), allowNull: false },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    descripcion: DataTypes.TEXT,
    normaRespaldo: { type: DataTypes.STRING(200) },
    categoria: { type: DataTypes.STRING(80), allowNull: false },
    periodicidad: { type: DataTypes.ENUM('unica', 'mensual', 'trimestral', 'semestral', 'anual'), allowNull: false, defaultValue: 'anual' },
    criticidad: { type: DataTypes.ENUM('alta', 'media', 'baja'), allowNull: false, defaultValue: 'media' },
    vigenciaDesde: { type: DataTypes.DATEONLY },
    vigenciaHasta: { type: DataTypes.DATEONLY },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'requisitos_legales', timestamps: true, underscored: true });

  RequisitoLegal.associate = (db) => {
    RequisitoLegal.belongsTo(db.EnteRegulador, { foreignKey: 'enteId', as: 'ente' });
    RequisitoLegal.hasMany(db.EmpresaRequisito, { foreignKey: 'requisitoId', as: 'empresaRequisitos' });
  };

  return RequisitoLegal;
};

export default RequisitoLegalModel;