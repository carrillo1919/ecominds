import { User } from '../models/index.js';
import { logSecurityEvent } from '../utils/logger.js';

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

// PATCH /api/users/:id/rol  (solo admin)
const updateRol = async (req, res, next) => {
  try {
    const { rol } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'No puede cambiar su propio rol' });
    }

    const rolAnterior = user.rol;
    user.rol = rol;
    await user.save();

    logSecurityEvent('rol_changed', {
      userId: user.id,
      adminId: req.user.id,
      rolAnterior,
      rolNuevo: rol,
    });

    return res.json({ message: 'Rol actualizado', user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

export { me, getAll, updateRol };
