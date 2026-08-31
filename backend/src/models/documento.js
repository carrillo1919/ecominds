const ESTADOS_DOCUMENTO = ['vigente', 'vencido', 'archivado'];

const DocumentoModel = (sequelize, DataTypes) => {
  const Documento = sequelize.define('Documento', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    empresaId: { type: DataTypes.UUID, allowNull: false, field: 'empresa_id' },
    empresaRequisitoId: { type: DataTypes.UUID, allowNull: true, field: 'empresa_requisito_id' },
    responsableId: { type: DataTypes.UUID, allowNull: true, field: 'responsable_id' },
    titulo: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    fechaDocumento: { type: DataTypes.DATEONLY, allowNull: true, field: 'fecha_documento' },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_vencimiento' },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_DOCUMENTO),
      allowNull: false,
      defaultValue: 'vigente',
    },
  }, { tableName: 'Documentos', timestamps: true });

  Documento.ESTADOS = ESTADOS_DOCUMENTO;

  Documento.associate = (db) => {
    Documento.belongsTo(db.Empresa, { foreignKey: 'empresaId', as: 'empresa' });
    Documento.belongsTo(db.EmpresaRequisito, { foreignKey: 'empresaRequisitoId', as: 'empresaRequisito' });
    Documento.belongsTo(db.Empleado, { foreignKey: 'responsableId', as: 'responsable' });
    Documento.hasMany(db.ArchivoAdjunto, { foreignKey: 'documentoId', as: 'archivos', onDelete: 'CASCADE' });
  };

  return Documento;
};

export default DocumentoModel;
