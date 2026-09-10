import { Op } from 'sequelize';
import { Empleado, User, Empresa } from '../../../models/index.js';
import { applyEmpresaScope, assertEmpresaInScope } from '../../../shared/security/tenant-scope.js';
import HttpError from '../../../shared/http/errors/http-error.js';

const INCLUDES = [
  { model: User, as: 'usuario', attributes: ['id', 'email', 'rol', 'activo'] },
  { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
];

const resolveWhere = (req) => {
  const where = applyEmpresaScope({}, req);
  if (req.query.empresaId) {
    assertEmpresaInScope(req.query.empresaId, req);
    where.empresaId = req.query.empresaId;
  }
  return where;
};

export const listarEmpleados = async (req) => {
  const where = resolveWhere(req);
  return Empleado.findAll({
    where,
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    include: INCLUDES,
  });
};

export const listarEmpleadosActivos = async (req) => {
  const where = { ...resolveWhere(req), activo: true };
  return Empleado.findAll({
    where,
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    attributes: ['id', 'nombre', 'apellido', 'cargo', 'telefono', 'email', 'empresaId'],
  });
};

export const obtenerEmpleado = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const empleado = await Empleado.findOne({ where, include: INCLUDES });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }
  return empleado;
};

export const crearEmpleado = async (req) => {
  const empresaId = (req.scope?.all || req.user.rol === 'auditor')
    ? req.body.empresaId
    : (req.body.empresaId || req.scope?.empresaIds?.[0]);
  if (!empresaId) {
    throw new HttpError(400, 'empresaId es requerido');
  }
  assertEmpresaInScope(empresaId, req);

  const { nombre, apellido, cedula, cargo, telefono, email, crearUsuario, passwordUsuario, rolUsuario } = req.body;

  const duplicado = await Empleado.findOne({
    where: {
      empresaId,
      [Op.or]: [{ cedula: String(cedula).trim() }, { email: String(email).trim().toLowerCase() }],
    },
  });
  if (duplicado) {
    throw new HttpError(409, 'Ya existe un empleado con esa cédula o correo en esta empresa');
  }

  let userId = null;

  // Solo el admin puede crear el usuario asociado
  if (crearUsuario && req.user.rol === 'admin') {
    const existeUser = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (existeUser) {
      throw new HttpError(409, 'Ya existe un usuario con ese correo');
    }

    const nuevoUser = await User.create({
      nombre: String(nombre).trim(),
      apellido: String(apellido).trim(),
      email: String(email).trim().toLowerCase(),
      password: passwordUsuario || String(cedula).trim(),
      rol: rolUsuario || 'responsable',
      verified: true,
      activo: true,
    });
    userId = nuevoUser.id;
  }

  const empleado = await Empleado.create({
    empresaId,
    userId,
    nombre: String(nombre).trim(),
    apellido: String(apellido).trim(),
    cedula: String(cedula).trim(),
    cargo: cargo ? String(cargo).trim() : null,
    telefono: telefono ? String(telefono).trim() : null,
    email: String(email).trim().toLowerCase(),
  });

  return Empleado.findByPk(empleado.id, { include: INCLUDES });
};

// El admin asigna/crea un usuario a un empleado existente
export const asignarUsuarioAEmpleado = async (id, req) => {
  const empleado = await Empleado.findByPk(id);
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }
  if (empleado.userId) {
    throw new HttpError(409, 'El empleado ya tiene un usuario asociado');
  }

  const { passwordUsuario, rolUsuario } = req.body;
  const email = empleado.email;

  const existeUser = await User.findOne({ where: { email } });
  if (existeUser) {
    throw new HttpError(409, 'Ya existe un usuario con ese correo');
  }

  const nuevoUser = await User.create({
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    email,
    password: passwordUsuario || empleado.cedula,
    rol: rolUsuario || 'responsable',
    verified: true,
    activo: true,
  });

  empleado.userId = nuevoUser.id;
  await empleado.save();

  return nuevoUser.toPublicJSON();
};

export const actualizarEmpleado = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const empleado = await Empleado.findOne({ where });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }

  const campos = ['nombre', 'apellido', 'cedula', 'cargo', 'telefono', 'email', 'activo'];
  campos.forEach((campo) => {
    if (req.body[campo] === undefined) return;
    const value = req.body[campo];

    if (campo === 'email') empleado.email = String(value).trim().toLowerCase();
    else if (campo === 'activo') empleado[campo] = Boolean(value);
    else if (campo === 'cargo' || campo === 'telefono') empleado[campo] = value ? String(value).trim() || null : null;
    else empleado[campo] = String(value).trim();
  });

  // Solo admin/auditor puede cambiar de empresa
  if (req.body.empresaId !== undefined && (req.user.rol === 'admin' || req.user.rol === 'auditor')) {
    assertEmpresaInScope(req.body.empresaId, req);
    empleado.empresaId = req.body.empresaId;
  }

  await empleado.save();
  return Empleado.findByPk(empleado.id, { include: INCLUDES });
};

// Baja lógica
export const darDeBajaEmpleado = async (id, req) => {
  const where = { id, ...resolveWhere(req) };
  const empleado = await Empleado.findOne({ where });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }

  empleado.activo = false;
  await empleado.save();
  return empleado;
};