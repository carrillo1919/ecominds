const BaseCrudService = require('./baseCrudService');
const { RequisitoLegal, EnteRegulador } = require('../models');

module.exports = new BaseCrudService(RequisitoLegal, [{ model: EnteRegulador, as: 'ente' }]);
