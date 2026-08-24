const BaseCrudService = require('./baseCrudService');
const { Empresa, RequisitoLegal, EnteRegulador } = require('../models');

class EmpresaService extends BaseCrudService {
  constructor() {
    super(Empresa);
  }

  listWithRequisitos() {
    return Empresa.findAll({
      include: [
        {
          model: RequisitoLegal,
          as: 'requisitos',
          through: { attributes: ['id', 'fechaAsignacion', 'responsableId', 'observaciones'] },
          include: [{ model: EnteRegulador, as: 'ente' }]
        }
      ]
    });
  }

  getByIdWithRequisitos(id) {
    return Empresa.findByPk(id, {
      include: [
        {
          model: RequisitoLegal,
          as: 'requisitos',
          through: { attributes: ['id', 'fechaAsignacion', 'responsableId', 'observaciones'] },
          include: [{ model: EnteRegulador, as: 'ente' }]
        }
      ]
    });
  }
}

module.exports = new EmpresaService();
