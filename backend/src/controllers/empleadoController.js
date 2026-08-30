import { Op } from 'sequelize';
import { Empleado, User, Empresa } from '../models/index.js';

// admin y auditor ven todas las empresas; los demás solo la suya
const resolveWhere = (req) => {
  if (['admin', 'auditor'].includes(req.user.rol) && req.query.empresaId) {
    return { empresaId: req.query.empresaId };
  }
  if (['admin', 'auditor'].includes(req.user.rol)) {
    return {};
  }
  return { empresaId: req.empresaId };
};

// GET /api/empleados
const getAll = async (req, res, next) => {
  try {
    const where = resolveWhere(req);
    const empleados = await Empleado.findAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      include: [
        { model: User, as: 'usuario', attributes: ['id', 'email', 'rol', 'activo'] },
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
      ],
    });
    return res.json({ empleados });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empleados/activos  — para dropdown de Responsable
const getActivos = async (req, res, next) => {
  try {
    const where = { ...resolveWhere(req), activo: true };
    const empleados = await Empleado.findAll({
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'apellido', 'cargo', 'email'],
    });
    return res.json({ empleados });
  } catch (error) {
    return next(error);
  }
};

// GET /api/empleados/:id
const getOne = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const empleado = await Empleado.findOne({
      where,
      include: [
        { model: User, as: 'usuario', attributes: ['id', 'email', 'rol', 'activo'] },
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] },
      ],
    });
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
    return res.json({ empleado });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empleados
const create = async (req, res, next) => {
  try {
    // Determinar empresaId: admin puede indicarla en el body; demás usan la propia
    let empresaId;
    if (['admin', 'auditor'].includes(req.user.rol)) {
      empresaId = req.body.empresaId;
      if (!empresaId) return res.status(400).json({ message: 'empresaId es requerido' });
    } else {
      empresaId = req.empresaId;
    }

    const { nombre, apellido, cedula, cargo, email, crearUsuario, passwordUsuario, rolUsuario } = req.body;

    const duplicado = await Empleado.findOne({
      where: { [Op.or]: [{ cedula: String(cedula).trim() }, { email: String(email).trim().toLowerCase() }] },
    });
    if (duplicado) {
      return res.status(409).json({ message: 'Ya existe un empleado con esa cédula o correo' });
    }

    let userId = null;

    // Solo el admin puede crear el usuario asociado
    if (crearUsuario && req.user.rol === 'admin') {
      const existeUser = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });
      if (existeUser) return res.status(409).json({ message: 'Ya existe un usuario con ese correo' });

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
      email: String(email).trim().toLowerCase(),
    });

    const result = await Empleado.findByPk(empleado.id, {
      include: [{ model: User, as: 'usuario', attributes: ['id', 'email', 'rol', 'activo'] }],
    });

    return res.status(201).json({ message: 'Empleado registrado', empleado: result });
  } catch (error) {
    return next(error);
  }
};

// POST /api/empleados/:id/usuario  — el admin asigna/crea un usuario a un empleado existente
const asignarUsuario = async (req, res, next) => {
  try {
    const empleado = await Empleado.findByPk(req.params.id);
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
    if (empleado.userId) return res.status(409).json({ message: 'El empleado ya tiene un usuario asociado' });

    const { passwordUsuario, rolUsuario } = req.body;
    const email = empleado.email;

    const existeUser = await User.findOne({ where: { email } });
    if (existeUser) return res.status(409).json({ message: 'Ya existe un usuario con ese correo' });

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

    return res.status(201).json({ message: 'Usuario creado y asignado al empleado', usuario: nuevoUser.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/empleados/:id
const update = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const empleado = await Empleado.findOne({ where });
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

    const campos = ['nombre', 'apellido', 'cedula', 'cargo', 'email', 'activo'];
    campos.forEach((campo) => {
      if (req.body[campo] !== undefined) empleado[campo] = req.body[campo];
    });

    await empleado.save();
    return res.json({ message: 'Empleado actualizado', empleado });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/empleados/:id  — baja lógica
const remove = async (req, res, next) => {
  try {
    const where = { id: req.params.id, ...resolveWhere(req) };
    const empleado = await Empleado.findOne({ where });
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

    empleado.activo = false;
    await empleado.save();
    return res.json({ message: 'Empleado dado de baja', empleado });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getActivos, getOne, create, asignarUsuario, update, remove };
