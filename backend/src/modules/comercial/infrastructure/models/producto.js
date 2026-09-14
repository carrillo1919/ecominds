const ProductoModel = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    descripcion: DataTypes.TEXT,
    precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    unidadMedida: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'unidad' },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'Productos',
    timestamps: true,
  });

  Producto.associate = (db) => {
    Producto.hasMany(db.EmpresaServicio, { foreignKey: 'productoId', as: 'asignaciones' });
  };

  return Producto;
};

export default ProductoModel;
