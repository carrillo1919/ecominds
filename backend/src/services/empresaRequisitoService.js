const BaseCrudService = require('./baseCrudService');
const { EmpresaRequisito, Empresa, RequisitoLegal, EnteRegulador } = require('../models');

class EmpresaRequisitoService extends BaseCrudService {
  constructor() {
    super(EmpresaRequisito, [
      { model: Empresa, as: 'empresa' },
      { model: RequisitoLegal, as: 'requisito', include: [{ model: EnteRegulador, as: 'ente' }] }
    ]);
  }

  listByEmpresa(empresaId) {
    return this.list({ empresaId });
  }
}

module.exports = new EmpresaRequisitoService();
