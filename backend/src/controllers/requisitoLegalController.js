const buildCrudController = require('./crudControllerFactory');
const requisitoLegalService = require('../services/requisitoLegalService');

module.exports = buildCrudController(requisitoLegalService);
