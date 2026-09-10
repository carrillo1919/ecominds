const ServicioModel = (sequelize, DataTypes) => {
  const Servicio = sequelize.define('Servicio', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    descripcion: DataTypes.TEXT,
    precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    impuesto: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'Servicios',
    timestamps: true,
  });

  Servicio.associate = (db) => {
    Servicio.hasMany(db.EmpresaServicio, { foreignKey: 'servicioId', as: 'asignaciones' });
  };

  return Servicio;
};

export default ServicioModel;
