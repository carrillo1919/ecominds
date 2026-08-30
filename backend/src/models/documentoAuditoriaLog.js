const ACCIONES = ['creado', 'editado', 'eliminado'];

const DocumentoAuditoriaLogModel = (sequelize, DataTypes) => {
  const DocumentoAuditoriaLog = sequelize.define('DocumentoAuditoriaLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    documentoId: { type: DataTypes.UUID, allowNull: true, field: 'documento_id' },
    empleadoId: { type: DataTypes.UUID, allowNull: true, field: 'empleado_id' },
    empresaId: { type: DataTypes.UUID, allowNull: false, field: 'empresa_id' },
    accion: { type: DataTypes.ENUM(...ACCIONES), allowNull: false },
    detalle: { type: DataTypes.JSONB, allowNull: true },
  }, { tableName: 'DocumentoAuditoriaLogs', timestamps: true });

  DocumentoAuditoriaLog.ACCIONES = ACCIONES;

  DocumentoAuditoriaLog.associate = (db) => {
    DocumentoAuditoriaLog.belongsTo(db.Documento, { foreignKey: 'documentoId', as: 'documento' });
    DocumentoAuditoriaLog.belongsTo(db.Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
  };

  return DocumentoAuditoriaLog;
};

export default DocumentoAuditoriaLogModel;
