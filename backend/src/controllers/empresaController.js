const buildCrudController = require('./crudControllerFactory');
const empresaService = require('../services/empresaService');

const base = buildCrudController(empresaService);

module.exports = {
  ...base,
  listWithRequisitos: async (req, res) => {
    try {
      res.json(await empresaService.listWithRequisitos());
    } catch (error) {
      res.status(500).json({ message: 'Error interno', detail: error.message });
    }
  },
  getByIdWithRequisitos: async (req, res) => {
    try {
      const entity = await empresaService.getByIdWithRequisitos(req.params.id);
      if (!entity) {
        return res.status(404).json({ message: 'No encontrado' });
      }
      res.json(entity);
    } catch (error) {
      res.status(500).json({ message: 'Error interno', detail: error.message });
    }
  }
};
