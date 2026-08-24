const buildCrudController = require('./crudControllerFactory');
const enteReguladorService = require('../services/enteReguladorService');

module.exports = buildCrudController(enteReguladorService);
