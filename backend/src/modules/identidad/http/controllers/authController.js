import {
  registrarUsuario,
  autenticarUsuario,
  verificarEmail,
  solicitarRestablecimiento,
  refrescarSesion,
  restablecerPassword,
  emitirCookies,
  limpiarCookies,
} from '../../application/authService.js';

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const user = await registrarUsuario(req.body);
    return res.status(201).json({
      message: 'Registro exitoso. Revise su correo para verificar la cuenta.',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const user = await autenticarUsuario(req.body, req.ip);
    emitirCookies(res, user);
    return res.json({ user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/verify-email?token=...
const verifyEmail = async (req, res, next) => {
  try {
    await verificarEmail(req.query.token);
    return res.json({ message: 'Cuenta verificada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const response = await solicitarRestablecimiento(req.body, req.ip);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    const user = await refrescarSesion(token, req.ip);
    emitirCookies(res, user);
    return res.json({ user: user.toPublicJSON() });
  } catch (error) {
    if (error.status === 401) limpiarCookies(res);
    return next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  limpiarCookies(res);
  return res.json({ message: 'Sesión cerrada' });
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    await restablecerPassword(req.body, req.ip);
    return res.json({ message: 'Contrasena actualizada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

export { register, login, verifyEmail, forgotPassword, resetPassword, refresh, logout };
