const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Empresa',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      nit: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      razonSocial: { type: DataTypes.STRING(200), allowNull: false },
      estado: { type: DataTypes.ENUM('activa', 'inactiva', 'suspendida'), allowNull: false, defaultValue: 'activa' },
      responsableId: { type: DataTypes.UUID, allowNull: true }
    },
    {
      tableName: 'empresas',
      underscored: true,
      timestamps: true
    }
  );
};
