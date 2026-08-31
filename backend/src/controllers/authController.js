import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

import { User } from '../models/index.js';
import {
  generateToken,
  resetTokenExpiry,
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from '../utils/tokens.js';
import { cookieOptions, COOKIE_NAMES } from '../config/security.js';
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from '../services/emailService.js';
import { logSecurityEvent } from '../utils/logger.js';

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(COOKIE_NAMES.accessToken, accessToken, cookieOptions(ACCESS_TOKEN_TTL_MS));
  res.cookie(COOKIE_NAMES.refreshToken, refreshToken, cookieOptions(REFRESH_TOKEN_TTL_MS));
};

const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE_NAMES.accessToken, { path: '/', httpOnly: true });
  res.clearCookie(COOKIE_NAMES.refreshToken, { path: '/', httpOnly: true });
};

const hashRefreshToken = (token) => bcrypt.hashSync(token, 10);
const compareRefreshToken = (token, hash) => bcrypt.compareSync(token, hash);

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'El correo ya se encuentra registrado' });
    }

    const verificationToken = generateToken();

    // El rol nunca se acepta desde el registro publico.
    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      rol: 'lector',
      verified: false,
      verificationToken,
    });

    await emailService.sendVerificationEmail(user, verificationToken);

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
    const { email, password } = req.body;

    const user = await User.scope('withSecrets').findOne({
      where: { email: String(email).toLowerCase() },
    });

    if (!user || !(await user.comparePassword(password))) {
      logSecurityEvent('login_failed', { ip: req.ip, userAgent: req.headers['user-agent'] });
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    if (!user.activo) {
      logSecurityEvent('login_denied_inactive', { userId: user.id });
      return res.status(403).json({ message: 'Su usuario esta desactivado. Contacte al administrador.' });
    }

    if (!user.verified) {
      logSecurityEvent('login_denied_unverified', { userId: user.id });
      return res.status(403).json({ message: 'Debe verificar su correo antes de iniciar sesion' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashRefreshToken(refreshToken);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);
    logSecurityEvent('login_success', { userId: user.id, rol: user.rol });

    return res.json({ user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/verify-email?token=...
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) return res.status(400).json({ message: 'Token no proporcionado' });

    const user = await User.scope('withSecrets').findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ message: 'El enlace de verificacion es invalido o ya fue utilizado' });
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    return res.json({ message: 'Cuenta verificada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      message: 'Si el correo existe en el sistema, recibira un enlace para restablecer su contrasena.',
    };

    const user = await User.scope('withSecrets').findOne({
      where: { email: String(email).toLowerCase() },
    });

    // Respuesta generica para no revelar si el correo existe.
    if (!user) return res.json(genericResponse);

    const token = generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetTokenExpiry();
    await user.save();

    await sendResetPasswordEmail(user, token);
    logSecurityEvent('password_reset_requested', { userId: user.id });

    return res.json(genericResponse);
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.scope('withSecrets').findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace es invalido o ha expirado' });
    }

    user.password = password; // el hook beforeSave lo hashea
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    logSecurityEvent('password_reset_completed', { userId: user.id });

    return res.json({ message: 'Contrasena actualizada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Sesion no proporcionada' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Sesion invalida' });
    }

    if (payload.type !== 'refresh') {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Token invalido' });
    }

    const user = await User.scope('withSecrets').findByPk(payload.sub);
    if (!user || !user.activo || !user.refreshTokenHash || !compareRefreshToken(refreshToken, user.refreshTokenHash)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Sesion invalida' });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshTokenHash = hashRefreshToken(newRefreshToken);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);
    logSecurityEvent('token_refreshed', { userId: user.id });

    return res.json({ user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.scope('withSecrets').findByPk(payload.sub);
        if (user) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch {
        // Ignorar errores de token invalido; igualmente limpiamos cookies.
      }
    }

    clearAuthCookies(res);
    logSecurityEvent('logout', { userId: req.user?.id });

    return res.json({ message: 'Sesion cerrada' });
  } catch (error) {
    return next(error);
  }
};

export { register, login, verifyEmail, forgotPassword, resetPassword, refresh, logout };
