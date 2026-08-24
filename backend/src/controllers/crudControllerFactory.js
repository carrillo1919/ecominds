const withErrorHandling = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Error interno', detail: error.message });
  }
};

const buildCrudController = (service) => ({
  list: withErrorHandling(async (req, res) => {
    res.json(await service.list());
  }),
  getById: withErrorHandling(async (req, res) => {
    const item = await service.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.json(item);
  }),
  create: withErrorHandling(async (req, res) => {
    const created = await service.create(req.body);
    res.status(201).json(created);
  }),
  update: withErrorHandling(async (req, res) => {
    const updated = await service.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.json(updated);
  }),
  remove: withErrorHandling(async (req, res) => {
    const deleted = await service.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'No encontrado' });
    }
    res.status(204).send();
  })
});

module.exports = buildCrudController;
