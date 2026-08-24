const EmpresaModel = (sequelize, DataTypes) => {
  const Empresa = sequelize.define('Empresa', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    rif: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    sector: DataTypes.STRING,
    actividad: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    responsable: DataTypes.STRING,
    responsableId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'responsable_id', // <-- mapeo explícito a la columna de BD
    },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'Empresas', timestamps: true });

  Empresa.associate = (db) => {
    Empresa.belongsTo(db.User, { foreignKey: 'responsableId', as: 'responsableUsuario' });
    Empresa.hasMany(db.EmpresaRequisito, { foreignKey: 'empresaId', as: 'empresaRequisitos' });
    Empresa.hasMany(db.Auditoria, { foreignKey: 'empresaId', as: 'auditorias' });
  };

  return Empresa;
};

export default EmpresaModel;
