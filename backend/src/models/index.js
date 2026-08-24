const sequelize = require('../config/database');

const Empresa = require('./empresa')(sequelize);
const EnteRegulador = require('./enteRegulador')(sequelize);
const RequisitoLegal = require('./requisitoLegal')(sequelize);
const EmpresaRequisito = require('./empresaRequisito')(sequelize);

EnteRegulador.hasMany(RequisitoLegal, { foreignKey: 'enteId', as: 'requisitos' });
RequisitoLegal.belongsTo(EnteRegulador, { foreignKey: 'enteId', as: 'ente' });

Empresa.belongsToMany(RequisitoLegal, {
  through: EmpresaRequisito,
  foreignKey: 'empresaId',
  otherKey: 'requisitoId',
  as: 'requisitos'
});
RequisitoLegal.belongsToMany(Empresa, {
  through: EmpresaRequisito,
  foreignKey: 'requisitoId',
  otherKey: 'empresaId',
  as: 'empresas'
});

Empresa.hasMany(EmpresaRequisito, { foreignKey: 'empresaId', as: 'asignaciones' });
EmpresaRequisito.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });
RequisitoLegal.hasMany(EmpresaRequisito, { foreignKey: 'requisitoId', as: 'asignaciones' });
EmpresaRequisito.belongsTo(RequisitoLegal, { foreignKey: 'requisitoId', as: 'requisito' });

module.exports = {
  sequelize,
  Empresa,
  EnteRegulador,
  RequisitoLegal,
  EmpresaRequisito
};
