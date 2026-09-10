const BLOQUES = ['General', 'Almacenamiento', 'Transporte', 'Uso/Manipulación', 'Generación'];

const RequisitoModel = (sequelize, DataTypes) => {
  const Requisito = sequelize.define('Requisito', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bloque: { type: DataTypes.STRING, allowNull: false },
    codigo: { type: DataTypes.STRING, allowNull: false, unique: true },
    requisito: { type: DataTypes.TEXT, allowNull: false },
    enteRegulador: DataTypes.STRING,
    baseLegal: DataTypes.STRING,
    critico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'Requisitos', timestamps: true });

  Requisito.BLOQUES = BLOQUES;

  Requisito.associate = (db) => {
    Requisito.hasMany(db.AuditoriaItem, {
      foreignKey: 'requisitoId',
      as: 'items',
    });
  };

  return Requisito;
};

export default RequisitoModel;
