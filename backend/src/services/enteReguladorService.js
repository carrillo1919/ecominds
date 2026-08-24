const BaseCrudService = require('./baseCrudService');
const { EnteRegulador } = require('../models');

module.exports = new BaseCrudService(EnteRegulador);
