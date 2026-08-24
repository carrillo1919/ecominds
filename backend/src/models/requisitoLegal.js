const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'RequisitoLegal',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      enteId: { type: DataTypes.UUID, allowNull: false },
      codigo: { type: DataTypes.STRING(40), allowNull: false },
      titulo: { type: DataTypes.STRING(200), allowNull: false },
      descripcion: { type: DataTypes.STRING(2000), allowNull: true },
      normaRespaldo: { type: DataTypes.STRING(200), allowNull: true },
      categoria: { type: DataTypes.STRING(80), allowNull: false },
      periodicidad: {
        type: DataTypes.ENUM('unica', 'mensual', 'trimestral', 'semestral', 'anual'),
        allowNull: false,
        defaultValue: 'anual'
      },
      criticidad: {
        type: DataTypes.ENUM('alta', 'media', 'baja'),
        allowNull: false,
        defaultValue: 'media'
      },
      vigenciaDesde: { type: DataTypes.DATEONLY, allowNull: true },
      vigenciaHasta: { type: DataTypes.DATEONLY, allowNull: true },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: 'requisitos_legales',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['ente_id', 'codigo'] }]
    }
  );
};
