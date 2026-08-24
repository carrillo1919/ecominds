import { Requisito } from '../models/index.js';

// GET /api/requisitos
const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.activo !== undefined) where.activo = req.query.activo === 'true';

    const requisitos = await Requisito.findAll({ where, order: [['orden', 'ASC'], ['codigo', 'ASC']] });
    return res.json({ requisitos });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/requisitos/:id  (admin) - permite configurar criticidad y vigencia
const update = async (req, res, next) => {
  try {
    const requisito = await Requisito.findByPk(req.params.id);
    if (!requisito) return res.status(404).json({ message: 'Requisito no encontrado' });

    ['critico', 'activo', 'enteRegulador', 'baseLegal', 'requisito'].forEach((campo) => {
      if (req.body[campo] !== undefined) requisito[campo] = req.body[campo];
    });

    await requisito.save();
    return res.json({ message: 'Requisito actualizado', requisito });
  } catch (error) {
    return next(error);
  }
};

export { getAll, update };
