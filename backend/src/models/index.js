import { Sequelize } from 'sequelize';

import sequelize from '../shared/database/connection.js';
import UserModel from '../modules/identidad/infrastructure/models/user.js';
import EmpresaModel from '../modules/organizaciones/infrastructure/models/empresa.js';
import EmpleadoModel from '../modules/organizaciones/infrastructure/models/empleado.js';
import EmpresaAsignacionModel from '../modules/organizaciones/infrastructure/models/empresaAsignacion.js';
import RequisitoModel from '../modules/cumplimiento/infrastructure/models/requisito.js';
import RequisitoLegalModel from '../modules/cumplimiento/infrastructure/models/requisitoLegal.js';
import EnteReguladorModel from '../modules/cumplimiento/infrastructure/models/enteRegulador.js';
import EmpresaRequisitoModel from '../modules/cumplimiento/infrastructure/models/empresaRequisito.js';
import AuditoriaModel from '../modules/auditorias/infrastructure/models/auditoria.js';
import AuditoriaItemModel from '../modules/auditorias/infrastructure/models/auditoriaItem.js';
import DocumentoModel from '../modules/documentos/infrastructure/models/documento.js';
import ArchivoAdjuntoModel from '../modules/documentos/infrastructure/models/archivoAdjunto.js';
import DocumentoAuditoriaLogModel from '../modules/documentos/infrastructure/models/documentoAuditoriaLog.js';
import CalendarioEventoModel from '../modules/calendario/infrastructure/models/calendarioEvento.js';
import NotificacionConfigModel from '../modules/notificaciones/infrastructure/models/notificacionConfig.js';
import NotificacionLogModel from '../modules/notificaciones/infrastructure/models/notificacionLog.js';
import ProductoModel from '../modules/comercial/infrastructure/models/producto.js';
import ServicioModel from '../modules/comercial/infrastructure/models/servicio.js';
import EmpresaServicioModel from '../modules/comercial/infrastructure/models/empresaServicio.js';
import FacturaModel from '../modules/comercial/infrastructure/models/factura.js';
import FacturaItemModel from '../modules/comercial/infrastructure/models/facturaItem.js';

const User = UserModel(sequelize, Sequelize.DataTypes);
const Empresa = EmpresaModel(sequelize, Sequelize.DataTypes);
const Requisito = RequisitoModel(sequelize, Sequelize.DataTypes);
const Auditoria = AuditoriaModel(sequelize, Sequelize.DataTypes);
const AuditoriaItem = AuditoriaItemModel(sequelize, Sequelize.DataTypes);
const EnteRegulador = EnteReguladorModel(sequelize, Sequelize.DataTypes);
const RequisitoLegal = RequisitoLegalModel(sequelize, Sequelize.DataTypes);
const EmpresaRequisito = EmpresaRequisitoModel(sequelize, Sequelize.DataTypes);
const Empleado = EmpleadoModel(sequelize, Sequelize.DataTypes);
const EmpresaAsignacion = EmpresaAsignacionModel(sequelize, Sequelize.DataTypes);
const Documento = DocumentoModel(sequelize, Sequelize.DataTypes);
const ArchivoAdjunto = ArchivoAdjuntoModel(sequelize, Sequelize.DataTypes);
const DocumentoAuditoriaLog = DocumentoAuditoriaLogModel(sequelize, Sequelize.DataTypes);
const CalendarioEvento = CalendarioEventoModel(sequelize, Sequelize.DataTypes);
const NotificacionConfig = NotificacionConfigModel(sequelize, Sequelize.DataTypes);
const NotificacionLog = NotificacionLogModel(sequelize, Sequelize.DataTypes);
const Producto = ProductoModel(sequelize, Sequelize.DataTypes);
const Servicio = ServicioModel(sequelize, Sequelize.DataTypes);
const EmpresaServicio = EmpresaServicioModel(sequelize, Sequelize.DataTypes);
const Factura = FacturaModel(sequelize, Sequelize.DataTypes);
const FacturaItem = FacturaItemModel(sequelize, Sequelize.DataTypes);

const db = {
  sequelize,
  Sequelize,
  User,
  Empresa,
  Requisito,
  Auditoria,
  AuditoriaItem,
  EnteRegulador,
  RequisitoLegal,
  EmpresaRequisito,
  Empleado,
  EmpresaAsignacion,
  Documento,
  ArchivoAdjunto,
  DocumentoAuditoriaLog,
  CalendarioEvento,
  NotificacionConfig,
  NotificacionLog,
  Producto,
  Servicio,
  EmpresaServicio,
  Factura,
  FacturaItem,
};

Object.values(db).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

export {
  sequelize,
  Sequelize,
  User,
  Empresa,
  Requisito,
  Auditoria,
  AuditoriaItem,
  EnteRegulador,
  RequisitoLegal,
  EmpresaRequisito,
  Empleado,
  EmpresaAsignacion,
  Documento,
  ArchivoAdjunto,
  DocumentoAuditoriaLog,
  CalendarioEvento,
  NotificacionConfig,
  NotificacionLog,
  Producto,
  Servicio,
  EmpresaServicio,
  Factura,
  FacturaItem,
};

export default db;
