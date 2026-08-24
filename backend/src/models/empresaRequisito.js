const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'EmpresaRequisito',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      empresaId: { type: DataTypes.UUID, allowNull: false },
      requisitoId: { type: DataTypes.UUID, allowNull: false },
      fechaAsignacion: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
      responsableId: { type: DataTypes.UUID, allowNull: true },
      observaciones: { type: DataTypes.STRING(1000), allowNull: true }
    },
    {
      tableName: 'empresa_requisitos',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['empresa_id', 'requisito_id'] }]
    }
  );
};
