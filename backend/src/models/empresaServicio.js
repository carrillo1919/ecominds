const ESTADOS = ['pendiente', 'ejecutado', 'entregado', 'facturado', 'cancelado'];

const EmpresaServicioModel = (sequelize, DataTypes) => {
  const EmpresaServicio = sequelize.define('EmpresaServicio', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    empresaId: { type: DataTypes.UUID, allowNull: false },
    productoId: { type: DataTypes.UUID, allowNull: true },
    servicioId: { type: DataTypes.UUID, allowNull: true },
    cantidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1.0 },
    precioUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    impuesto: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    precioTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fechaEjecucion: { type: DataTypes.DATEONLY, allowNull: true },
    fechaEntrega: { type: DataTypes.DATEONLY, allowNull: true },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    observaciones: DataTypes.TEXT,
    facturaId: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'EmpresaServicios',
    timestamps: true,
  });

  EmpresaServicio.associate = (db) => {
    EmpresaServicio.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    EmpresaServicio.belongsTo(db.Producto, { foreignKey: 'productoId', as: 'producto' });
    EmpresaServicio.belongsTo(db.Servicio, { foreignKey: 'servicioId', as: 'servicio' });
    EmpresaServicio.belongsTo(db.Factura, { foreignKey: 'facturaId', as: 'factura' });
    EmpresaServicio.hasMany(db.FacturaItem, { foreignKey: 'empresaServicioId', as: 'facturaItems' });
  };

  EmpresaServicio.ESTADOS = ESTADOS;

  return EmpresaServicio;
};

export default EmpresaServicioModel;
