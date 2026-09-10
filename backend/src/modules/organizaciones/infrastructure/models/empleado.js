const EmpleadoModel = (sequelize, DataTypes) => {
  const Empleado = sequelize.define('Empleado', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    empresaId: { type: DataTypes.UUID, allowNull: false, field: 'empresa_id' },
    userId: { type: DataTypes.UUID, allowNull: true, unique: true, field: 'user_id' },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    cedula: { type: DataTypes.STRING, allowNull: false },
    cargo: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'Empleados',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['empresa_id', 'cedula'], name: 'empleados_empresa_cedula_unique' },
      { unique: true, fields: ['empresa_id', 'email'], name: 'empleados_empresa_email_unique' },
    ],
  });

  Empleado.associate = (db) => {
    Empleado.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    Empleado.belongsTo(db.User, { foreignKey: 'userId', as: 'usuario' });
    Empleado.hasMany(db.Documento, { foreignKey: 'responsableId', as: 'documentos' });
  };

  return Empleado;
};

export default EmpleadoModel;
