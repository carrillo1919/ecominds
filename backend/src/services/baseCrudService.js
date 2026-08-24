class BaseCrudService {
  constructor(model, include = []) {
    this.model = model;
    this.include = include;
  }

  list(where = {}) {
    return this.model.findAll({ where, include: this.include });
  }

  getById(id) {
    return this.model.findByPk(id, { include: this.include });
  }

  create(payload) {
    return this.model.create(payload);
  }

  async update(id, payload) {
    const entity = await this.model.findByPk(id);
    if (!entity) {
      return null;
    }
    return entity.update(payload);
  }

  async remove(id) {
    const deleted = await this.model.destroy({ where: { id } });
    return deleted > 0;
  }
}

module.exports = BaseCrudService;
