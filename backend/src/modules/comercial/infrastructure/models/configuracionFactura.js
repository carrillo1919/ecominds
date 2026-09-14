const TIPOS = ['impuesto', 'descuento'];

// Catalogo configurable de impuestos y descuentos aplicables a las facturas.
const ConfiguracionFacturaModel = (sequelize, DataTypes) => {
  const ConfiguracionFactura = sequelize.define('ConfiguracionFactura', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tipo: { type: DataTypes.ENUM(...TIPOS), allowNull: false },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'ConfiguracionFacturas',
    timestamps: true,
  });

  ConfiguracionFactura.TIPOS = TIPOS;

  return ConfiguracionFactura;
};

export default ConfiguracionFacturaModel;
