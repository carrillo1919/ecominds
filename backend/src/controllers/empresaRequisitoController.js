const buildCrudController = require('./crudControllerFactory');
const empresaRequisitoService = require('../services/empresaRequisitoService');

const base = buildCrudController(empresaRequisitoService);

module.exports = {
  ...base,
  list: async (req, res) => {
    try {
      if (req.query.empresaId) {
        return res.json(await empresaRequisitoService.listByEmpresa(req.query.empresaId));
      }
      return res.json(await empresaRequisitoService.list());
    } catch (error) {
      return res.status(500).json({ message: 'Error interno', detail: error.message });
    }
  }
};
