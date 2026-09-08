import { User, Empresa, EmpresaAsignacion } from '../models/index.js';
import logger from '../utils/logger.js';
import { getOrCreateDemoEmpresa } from '../services/demoEmpresaService.js';

// GET /api/users/me
const me = async (req, res) => res.json({ user: req.user.toPublicJSON() });

// GET /api/users  (solo admin)
const getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ users: users.map((u) => u.toPublicJSON()) });
  } catch (error) {
    return next(error);
  }
};

// Logica compartida para asignar empresas a un usuario auditor/lector.
// Si `empresaIds` viene vacio, se asigna automaticamente la empresa demo
// para que el usuario pueda explorar el sistema en modo prueba.
const asignarEmpresasInterno = async (user, rolContexto, empresaIds) => {
  let ids = [...new Set(empresaIds)];

  if (rolContexto === 'lector' && ids.length > 1) {
    const error = new Error('Un usuario lector solo puede tener asignada una empresa');
    error.status = 422;
    throw error;
  }

  if (!ids.length) {
    const demo = await getOrCreateDemoEmpresa();
    ids = [demo.id];
  } else {
    const empresas = await Empresa.findAll({ where: { id: ids }, attributes: ['id'] });
    if (empresas.length !== ids.length) {
      const error = new Error('Una o mas empresas indicadas no existen');
      error.status = 422;
      throw error;
    }
  }

  await EmpresaAsignacion.destroy({ where: { userId: user.id } });
  await EmpresaAsignacion.bulkCreate(
    ids.map((empresaId) => ({ userId: user.id, empresaId, rolContexto, activo: true }))
  );

  return EmpresaAsignacion.findAll({
    where: { userId: user.id },
    include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'esDemo'] }],
  });
};

// POST /api/users  (solo admin) — crea un usuario del sistema
const create = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;

    const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (existing) return res.status(409).json({ message: 'Ya existe un usuario con ese correo' });

    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      rol,
      verified: true,
      activo: true,
    });

    if (['auditor', 'lector'].includes(rol)) {
      const empresaIds = Array.isArray(req.body.empresaIds) ? req.body.empresaIds.filter(Boolean) : [];
      await asignarEmpresasInterno(user, rol, empresaIds);
    }

    logger.info({ event: 'user_created', actorUserId: req.user.id, targetUserId: user.id, rol: user.rol, ip: req.ip });

    return res.status(201).json({ message: 'Usuario creado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/users/:id  (solo admin) — edita datos basicos del usuario
const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { nombre, apellido, email, activo } = req.body;

    if (activo === false && user.id === req.user.id) {
      return res.status(400).json({ message: 'No puede desactivar su propio usuario' });
    }

    if (email !== undefined) {
      const normalizado = String(email).trim().toLowerCase();
      if (normalizado !== user.email) {
        const existente = await User.findOne({ where: { email: normalizado } });
        if (existente) return res.status(409).json({ message: 'Ya existe un usuario con ese correo' });
        user.email = normalizado;
      }
    }
    if (nombre !== undefined) user.nombre = String(nombre).trim();
    if (apellido !== undefined) user.apellido = String(apellido).trim();
    if (activo !== undefined) user.activo = Boolean(activo);

    await user.save();

    return res.json({ message: 'Usuario actualizado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/users/:id/rol  (solo admin)
const updateRol = async (req, res, next) => {
  try {
    const { rol } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'No puede cambiar su propio rol' });
    }

    const previousRol = user.rol;
    user.rol = rol;
    await user.save();
    logger.info({
      event: 'user_role_updated',
      actorUserId: req.user.id,
      targetUserId: user.id,
      previousRol,
      newRol: user.rol,
      ip: req.ip,
    });

    // Si deja de ser auditor/lector, se eliminan sus asignaciones de empresa.
    if (['auditor', 'lector'].includes(previousRol) && !['auditor', 'lector'].includes(rol)) {
      await EmpresaAsignacion.destroy({ where: { userId: user.id } });
    } else if (previousRol === 'auditor' && rol === 'lector') {
      // Un lector solo puede tener una empresa: se conserva la primera activa.
      const asignaciones = await EmpresaAsignacion.findAll({
        where: { userId: user.id, activo: true },
        order: [['createdAt', 'ASC']],
      });
      const [primera, ...resto] = asignaciones;
      await Promise.all(resto.map((a) => a.destroy()));
      if (primera) {
        primera.rolContexto = 'lector';
        await primera.save();
      } else {
        await asignarEmpresasInterno(user, 'lector', []);
      }
    } else if (previousRol === 'lector' && rol === 'auditor') {
      await EmpresaAsignacion.update({ rolContexto: 'auditor' }, { where: { userId: user.id } });
    }

    return res.json({ message: 'Rol actualizado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/users/:id/empresas  (solo admin) — lista las empresas asignadas a un auditor/lector
const getEmpresas = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const asignaciones = await EmpresaAsignacion.findAll({
      where: { userId: user.id },
      include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'esDemo'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.json({ asignaciones });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users/:id/empresas  (solo admin) — reemplaza las empresas asignadas
const setEmpresas = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!['auditor', 'lector'].includes(user.rol)) {
      return res.status(422).json({
        message: 'Solo se pueden asignar empresas a usuarios con rol auditor o lector',
      });
    }

    const empresaIds = Array.isArray(req.body.empresaIds) ? req.body.empresaIds.filter(Boolean) : [];
    const asignaciones = await asignarEmpresasInterno(user, user.rol, empresaIds);

    logger.info({ event: 'user_empresas_assigned', actorUserId: req.user.id, targetUserId: user.id, empresaIds, ip: req.ip });

    return res.json({ message: 'Empresas asignadas', asignaciones });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/users/:id/empresas/:empresaId  (solo admin)
const removeEmpresa = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const asignacion = await EmpresaAsignacion.findOne({
      where: { userId: user.id, empresaId: req.params.empresaId },
    });
    if (!asignacion) return res.status(404).json({ message: 'Asignacion no encontrada' });

    await asignacion.destroy();

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
