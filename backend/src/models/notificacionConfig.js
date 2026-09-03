export default (sequelize, DataTypes) => {
  const NotificacionConfig = sequelize.define('NotificacionConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.ENUM('documento_vencimiento', 'auditoria'),
      allowNull: false,
      unique: true,
    },
    rangosDias: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [30, 15, 1, 0],
    },
    horaEnvio: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '08:00:00',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    plantillaAsunto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plantillaCuerpo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'notificacion_configs',
    timestamps: true,
  });

  return NotificacionConfig;
};