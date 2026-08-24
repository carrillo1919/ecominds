const EnteReguladorModel = (sequelize, DataTypes) => {
  const EnteRegulador = sequelize.define('EnteRegulador', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING(160), allowNull: false },
    sigla: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    ambito: { type: DataTypes.ENUM('nacional', 'departamental', 'municipal', 'sectorial'), allowNull: false, defaultValue: 'nacional' },
    contacto: { type: DataTypes.STRING(160) },
    sitioWeb: { type: DataTypes.STRING, validate: { isUrl: true } },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'entes_reguladores', timestamps: true, underscored: true });

  EnteRegulador.associate = (db) => {
    EnteRegulador.hasMany(db.RequisitoLegal, { foreignKey: 'enteId', as: 'requisitos' });
  };

  return EnteRegulador;
};

export default EnteReguladorModel;