const TIPOS = ['impuesto', 'descuento'];

// Copia histórica de los impuestos y descuentos aplicados a una factura.
const FacturaConceptoModel = (sequelize, DataTypes) => {
  const FacturaConcepto = sequelize.define('FacturaConcepto', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    facturaId: { type: DataTypes.UUID, allowNull: false },
    configuracionId: { type: DataTypes.UUID, allowNull: true },
    tipo: { type: DataTypes.ENUM(...TIPOS), allowNull: false },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
  }, {
    tableName: 'FacturaConceptos',
    timestamps: true,
  });

  FacturaConcepto.associate = (db) => {
    FacturaConcepto.belongsTo(db.Factura, { foreignKey: 'facturaId', as: 'factura' });
    FacturaConcepto.belongsTo(db.ConfiguracionFactura, { foreignKey: 'configuracionId', as: 'configuracion' });
  };

  FacturaConcepto.TIPOS = TIPOS;

  return FacturaConcepto;
};

export default FacturaConceptoModel;
