const FacturaItemModel = (sequelize, DataTypes) => {
  const FacturaItem = sequelize.define('FacturaItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    facturaId: { type: DataTypes.UUID, allowNull: false },
    empresaServicioId: { type: DataTypes.UUID, allowNull: true },
    descripcion: { type: DataTypes.STRING(500), allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    precioUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    impuesto: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  }, {
    tableName: 'FacturaItems',
    timestamps: true,
  });

  FacturaItem.associate = (db) => {
    FacturaItem.belongsTo(db.Factura, { foreignKey: 'facturaId', as: 'factura' });
    FacturaItem.belongsTo(db.EmpresaServicio, { foreignKey: 'empresaServicioId', as: 'empresaServicio' });
  };

  return FacturaItem;
};

export default FacturaItemModel;
