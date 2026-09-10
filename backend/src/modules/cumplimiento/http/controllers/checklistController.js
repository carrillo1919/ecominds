import {
  listarChecklist,
  actualizarItemChecklist,
  crearItemChecklist,
  editarItemChecklist,
} from '../../application/checklistService.js';

// GET /api/requisitos
const getAll = async (req, res, next) => {
  try {
    const requisitos = await listarChecklist(req);
    return res.json({ requisitos });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/requisitos/:id  (admin) - permite configurar criticidad y vigencia
const update = async (req, res, next) => {
  try {
    const requisito = await actualizarItemChecklist(req.params.id, req);
    return res.json({ message: 'Requisito actualizado', requisito });
  } catch (error) {
    return next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const requisito = await crearItemChecklist(req);
    return res.status(201).json({ message: 'Requisito creado', requisito });
  } catch (error) {
    return next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const requisito = await editarItemChecklist(req.params.id, req);
    return res.json({ message: 'Requisito actualizado', requisito });
  } catch (error) {
    return next(error);
  }
};

export { getAll, update, create, edit };
