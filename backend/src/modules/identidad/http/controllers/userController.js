import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarRolUsuario,
  obtenerEmpresasUsuario,
  asignarEmpresasUsuario,
  desasignarEmpresa,
} from '../../application/userService.js';

// GET /api/users/me
const me = async (req, res) => res.json({ user: req.user.toPublicJSON() });

// GET /api/users  (solo admin)
const getAll = async (req, res, next) => {
  try {
    const users = await listarUsuarios();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users  (solo admin) — crea un usuario del sistema
const create = async (req, res, next) => {
  try {
    const user = await crearUsuario(req.body, req.user.id, req.ip);
    return res.status(201).json({ message: 'Usuario creado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/users/:id  (solo admin) — edita datos basicos del usuario
const update = async (req, res, next) => {
  try {
    const user = await actualizarUsuario(req.params.id, req.body, req.user.id);
    return res.json({ message: 'Usuario actualizado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/users/:id/rol  (solo admin)
const updateRol = async (req, res, next) => {
  try {
    const user = await cambiarRolUsuario(req.params.id, req.body.rol, req.user.id, req.ip);
    return res.json({ message: 'Rol actualizado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/users/:id/empresas  (solo admin) — lista las empresas asignadas a un auditor/lector
const getEmpresas = async (req, res, next) => {
  try {
    const asignaciones = await obtenerEmpresasUsuario(req.params.id);
    return res.json({ asignaciones });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users/:id/empresas  (solo admin) — reemplaza las empresas asignadas
const setEmpresas = async (req, res, next) => {
  try {
    const asignaciones = await asignarEmpresasUsuario(req.params.id, req.body.empresaIds, req.user.id, req.ip);
    return res.json({ message: 'Empresas asignadas', asignaciones });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/users/:id/empresas/:empresaId  (solo admin)
const removeEmpresa = async (req, res, next) => {
  try {
    await desasignarEmpresa(req.params.id, req.params.empresaId);
    return res.json({ message: 'Empresa desasignada' });
  } catch (error) {
    return next(error);
  }
};

export {
  me,
  getAll,
  create,
  update,
  updateRol,
  getEmpresas,
  setEmpresas,
  removeEmpresa,
};
