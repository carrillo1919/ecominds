import { User, Empresa, EmpresaAsignacion } from '../../../models/index.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import logger from '../../../shared/observability/logger.js';
import { getOrCreateDemoEmpresa } from '../../organizaciones/index.js';

export const listarUsuarios = async () => {
  const users = await User.findAll({ order: [['createdAt', 'DESC']] });
  return users.map((u) => u.toPublicJSON());
};

export const crearUsuario = async ({ nombre, apellido, email, password, rol, empresaIds = [] }, actorUserId, ip) => {
  const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    throw new HttpError(409, 'Ya existe un usuario con ese correo');
  }

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
    const ids = Array.isArray(empresaIds) ? empresaIds.filter(Boolean) : [];
    await asignarEmpresasInterno(user, rol, ids);
  }

  logger.info({ event: 'user_created', actorUserId, targetUserId: user.id, rol: user.rol, ip });
  return user;
};

export const actualizarUsuario = async (id, { nombre, apellido, email, activo }, actorUserId) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  if (activo === false && user.id === actorUserId) {
    throw new HttpError(400, 'No puede desactivar su propio usuario');
  }

  if (email !== undefined) {
    const normalizado = String(email).trim().toLowerCase();
    if (normalizado !== user.email) {
      const existente = await User.findOne({ where: { email: normalizado } });
      if (existente) {
        throw new HttpError(409, 'Ya existe un usuario con ese correo');
      }
      user.email = normalizado;
    }
  }
  if (nombre !== undefined) user.nombre = String(nombre).trim();
  if (apellido !== undefined) user.apellido = String(apellido).trim();
  if (activo !== undefined) user.activo = Boolean(activo);

  await user.save();
  return user;
};

export const cambiarRolUsuario = async (id, rol, actorUserId, ip) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  if (user.id === actorUserId) {
    throw new HttpError(400, 'No puede cambiar su propio rol');
  }

  const previousRol = user.rol;
  user.rol = rol;
  await user.save();
  logger.info({
    event: 'user_role_updated',
    actorUserId,
    targetUserId: user.id,
    previousRol,
    newRol: user.rol,
    ip,
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

  return user;
};

export const obtenerEmpresasUsuario = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  return EmpresaAsignacion.findAll({
    where: { userId: user.id },
    include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'rif', 'esDemo'] }],
    order: [['createdAt', 'ASC']],
  });
};

export const asignarEmpresasUsuario = async (id, empresaIds, actorUserId, ip) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  if (!['auditor', 'lector'].includes(user.rol)) {
    throw new HttpError(422, 'Solo se pueden asignar empresas a usuarios con rol auditor o lector');
  }

  const ids = Array.isArray(empresaIds) ? empresaIds.filter(Boolean) : [];
  const asignaciones = await asignarEmpresasInterno(user, user.rol, ids);

  logger.info({ event: 'user_empresas_assigned', actorUserId, targetUserId: user.id, empresaIds: ids, ip });
  return asignaciones;
};

export const desasignarEmpresa = async (id, empresaId) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const asignacion = await EmpresaAsignacion.findOne({
    where: { userId: user.id, empresaId },
  });
  if (!asignacion) {
    throw new HttpError(404, 'Asignacion no encontrada');
  }

  await asignacion.destroy();
};

// Logica compartida para asignar empresas a un usuario auditor/lector.
// Si `empresaIds` viene vacio, se asigna automaticamente la empresa demo
// para que el usuario pueda explorar el sistema en modo prueba.
const asignarEmpresasInterno = async (user, rolContexto, empresaIds) => {
  let ids = [...new Set(empresaIds)];

  if (rolContexto === 'lector' && ids.length > 1) {
    throw new HttpError(422, 'Un usuario lector solo puede tener asignada una empresa');
  }

  if (!ids.length) {
    const demo = await getOrCreateDemoEmpresa();
    ids = [demo.id];
  } else {
    const empresas = await Empresa.findAll({ where: { id: ids }, attributes: ['id'] });
    if (empresas.length !== ids.length) {
      throw new HttpError(422, 'Una o mas empresas indicadas no existen');
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