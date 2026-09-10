import {
  listarEmpresas,
  obtenerEmpresa,
  crearEmpresa,
  actualizarEmpresa,
  darDeBajaEmpresa,
} from '../../application/empresaService.js';

// GET /api/empresas
const getAll = async (req, res, next) => {
  try {
    const empresas = await listarEmpresas(req);
    return res.json({ empresas });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empresas/:id
const getOne = async (req, res, next) => {
  try {
    const empresa = await obtenerEmpresa(req.params.id, req);
    return res.json({ empresa });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empresas
const create = async (req, res, next) => {
  try {
    const empresa = await crearEmpresa(req);
    return res.status(201).json({ message: 'Empresa registrada', empresa });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/empresas/:id
const update = async (req, res, next) => {
  try {
    const empresa = await actualizarEmpresa(req.params.id, req);
    return res.json({ message: 'Empresa actualizada', empresa });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/empresas/:id  — baja lógica
const remove = async (req, res, next) => {
  try {
    const empresa = await darDeBajaEmpresa(req.params.id, req);
    return res.json({ message: 'Empresa dada de baja', empresa });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getOne, create, update, remove };
