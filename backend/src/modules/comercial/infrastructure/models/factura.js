const ESTADOS = ['borrador', 'emitida', 'pagada', 'anulada'];
const METODOS_PAGO = ['transferencia', 'pago_movil', 'efectivo', 'usd'];

const FacturaModel = (sequelize, DataTypes) => {
  const Factura = sequelize.define('Factura', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    numero: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    empresaId: { type: DataTypes.UUID, allowNull: false },
    fechaEmision: { type: DataTypes.DATEONLY, allowNull: false },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    impuesto: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0 },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'borrador',
    },
    notas: DataTypes.TEXT,
    pdfNombreArchivo: { type: DataTypes.STRING(255), allowNull: true },
    pdfContenido: { type: DataTypes.BLOB('long'), allowNull: true },
    fechaPago: { type: DataTypes.DATEONLY, allowNull: true },
    metodoPago: { type: DataTypes.ENUM(...METODOS_PAGO), allowNull: true },
    referenciaPago: { type: DataTypes.STRING(100), allowNull: true },
    bancoPago: { type: DataTypes.STRING(150), allowNull: true },
    telefonoPago: { type: DataTypes.STRING(30), allowNull: true },
    montoPago: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  }, {
    tableName: 'Facturas',
    timestamps: true,
  });

  Factura.associate = (db) => {
    Factura.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    Factura.hasMany(db.FacturaItem, { foreignKey: 'facturaId', as: 'items' });
    Factura.hasMany(db.EmpresaServicio, { foreignKey: 'facturaId', as: 'asignaciones' });
  };

  Factura.ESTADOS = ESTADOS;
  Factura.METODOS_PAGO = METODOS_PAGO;

  return Factura;
};

export default FacturaModel;
