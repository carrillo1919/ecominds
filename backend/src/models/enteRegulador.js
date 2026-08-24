const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'EnteRegulador',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      nombre: { type: DataTypes.STRING(160), allowNull: false },
      sigla: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      ambito: {
        type: DataTypes.ENUM('nacional', 'departamental', 'municipal', 'sectorial'),
        allowNull: false,
        defaultValue: 'nacional'
      },
      contacto: { type: DataTypes.STRING(160), allowNull: true },
      sitioWeb: { type: DataTypes.STRING(500), allowNull: true },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: 'entes_reguladores',
      underscored: true,
      timestamps: true
    }
  );
};
