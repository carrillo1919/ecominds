import { Sequelize } from 'sequelize';

import sequelize from '../config/database.js';
import UserModel from './user.js';
import EmpresaModel from './empresa.js';
import RequisitoModel from './requisito.js';
import AuditoriaModel from './auditoria.js';
import AuditoriaItemModel from './auditoriaItem.js';
import enteRegulador from './enteRegulador.js';
import requisitoLegal from './requisitoLegal.js';
import empresaRequisito from './empresaRequisito.js';
import EmpleadoModel from './empleado.js';
import DocumentoModel from './documento.js';
import ArchivoAdjuntoModel from './archivoAdjunto.js';
import DocumentoAuditoriaLogModel from './documentoAuditoriaLog.js';
import CalendarioEventoModel from './calendarioEvento.js';
import notificacionConfigModel from './notificacionConfig.js';
import notificacionLogModel from './notificacionLog.js';

const User = UserModel(sequelize, Sequelize.DataTypes);
const Empresa = EmpresaModel(sequelize, Sequelize.DataTypes);
const Requisito = RequisitoModel(sequelize, Sequelize.DataTypes);
const Auditoria = AuditoriaModel(sequelize, Sequelize.DataTypes);
const AuditoriaItem = AuditoriaItemModel(sequelize, Sequelize.DataTypes);
const EnteRegulador = enteRegulador(sequelize, Sequelize.DataTypes);
const RequisitoLegal = requisitoLegal(sequelize, Sequelize.DataTypes);
const EmpresaRequisito = empresaRequisito(sequelize, Sequelize.DataTypes);
const Empleado = EmpleadoModel(sequelize, Sequelize.DataTypes);
const Documento = DocumentoModel(sequelize, Sequelize.DataTypes);
const ArchivoAdjunto = ArchivoAdjuntoModel(sequelize, Sequelize.DataTypes);
const DocumentoAuditoriaLog = DocumentoAuditoriaLogModel(sequelize, Sequelize.DataTypes);
const CalendarioEvento = CalendarioEventoModel(sequelize, Sequelize.DataTypes);
const NotificacionConfig = notificacionConfigModel(sequelize, Sequelize.DataTypes);
const NotificacionLog = notificacionLogModel(sequelize, Sequelize.DataTypes);

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
  Documento,
  ArchivoAdjunto,
  DocumentoAuditoriaLog,
  CalendarioEvento,
  NotificacionConfig,
  NotificacionLog,
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
  Documento,
  ArchivoAdjunto,
  DocumentoAuditoriaLog,
  CalendarioEvento,
  NotificacionConfig,
  NotificacionLog,
};

export default db;
