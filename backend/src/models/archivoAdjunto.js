const ArchivoAdjuntoModel = (sequelize, DataTypes) => {
  const ArchivoAdjunto = sequelize.define('ArchivoAdjunto', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    documentoId: { type: DataTypes.UUID, allowNull: false, field: 'documento_id' },
    nombreArchivo: { type: DataTypes.STRING, allowNull: false, field: 'nombre_archivo' },
    contenido: { type: DataTypes.BLOB, allowNull: false },
    tipoMime: { type: DataTypes.STRING, allowNull: true, field: 'tipo_mime' },
    tamano: { type: DataTypes.INTEGER, allowNull: true },
  }, { tableName: 'ArchivosAdjuntos', timestamps: true });

  ArchivoAdjunto.associate = (db) => {
    ArchivoAdjunto.belongsTo(db.Documento, { foreignKey: 'documentoId', as: 'documento' });
  };

  return ArchivoAdjunto;
};

export default ArchivoAdjuntoModel;
