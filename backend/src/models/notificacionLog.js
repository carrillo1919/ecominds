export default (sequelize, DataTypes) => {
  const NotificacionLog = sequelize.define('NotificacionLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.ENUM('documento_vencimiento', 'auditoria', 'documento_cargado', 'auditoria_finalizada'),
      allowNull: false,
    },
    referenciaId: {
      type: DataTypes.STRING, // <-- cambiado de INTEGER a STRING para soportar UUID
      allowNull: false,
    },
    rangoDias: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    destinatario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asunto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cuerpo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('enviado', 'fallido'),
      defaultValue: 'enviado',
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'notificacion_logs',
    timestamps: true,
  });

  return NotificacionLog;
};