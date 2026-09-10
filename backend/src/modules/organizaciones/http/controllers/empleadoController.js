import {
  listarEmpleados,
  listarEmpleadosActivos,
  obtenerEmpleado,
  crearEmpleado,
  asignarUsuarioAEmpleado,
  actualizarEmpleado,
  darDeBajaEmpleado,
} from '../../application/empleadoService.js';

// GET /api/empleados
const getAll = async (req, res, next) => {
  try {
    const empleados = await listarEmpleados(req);
    return res.json({ empleados });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empleados/activos  — para dropdown de Responsable
const getActivos = async (req, res, next) => {
  try {
    const empleados = await listarEmpleadosActivos(req);
    return res.json({ empleados });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empleados/:id
const getOne = async (req, res, next) => {
  try {
    const empleado = await obtenerEmpleado(req.params.id, req);
    return res.json({ empleado });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empleados
const create = async (req, res, next) => {
  try {
    const empleado = await crearEmpleado(req);
    return res.status(201).json({ message: 'Empleado registrado', empleado });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empleados/:id/usuario  — el admin asigna/crea un usuario a un empleado existente
const asignarUsuario = async (req, res, next) => {
  try {
    const usuario = await asignarUsuarioAEmpleado(req.params.id, req);
    return res.status(201).json({ message: 'Usuario creado y asignado al empleado', usuario });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/empleados/:id
const update = async (req, res, next) => {
  try {
    const empleado = await actualizarEmpleado(req.params.id, req);
    return res.json({ message: 'Empleado actualizado', empleado });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/empleados/:id  — baja lógica
const remove = async (req, res, next) => {
  try {
    const empleado = await darDeBajaEmpleado(req.params.id, req);
    return res.json({ message: 'Empleado dado de baja', empleado });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getActivos, getOne, create, asignarUsuario, update, remove };
