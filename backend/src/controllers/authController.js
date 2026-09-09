import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge,
  path: '/',
});

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

const generateToken = () => crypto.randomBytes(32).toString('hex');

const hashEmail = (email) => crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex');

const resetTokenExpiry = () => new Date(Date.now() + 60 * 60 * 1000); // 1 hora

const setAuthCookies = (res, user) => {
  res.cookie('access_token', signAccessToken(user), cookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie('refresh_token', signRefreshToken(user), cookieOptions(REFRESH_TOKEN_MAX_AGE));
};

const clearAuthCookies = (res) => {
  const options = cookieOptions(0);
  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'El correo ya se encuentra registrado' });
    }

    const verificationToken = generateToken();

    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      rol: 'lector',
      verified: false,
      verificationToken,
    });

    await sendVerificationEmail(user, verificationToken);

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
    const normalizedEmail = String(email).toLowerCase();

    const user = await User.scope('withSecrets').findOne({
      where: { email: normalizedEmail },
    });

    if (!user || !(await user.comparePassword(password))) {
      logger.warn({ event: 'login_failed', emailHash: hashEmail(normalizedEmail), ip: req.ip });
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    if (!user.activo) {
      logger.warn({ event: 'login_failed_inactive_user', emailHash: hashEmail(normalizedEmail), ip: req.ip, userId: user.id });
      return res.status(403).json({ message: 'Su usuario esta desactivado. Contacte al administrador.' });
    }

    if (!user.verified) {
      logger.warn({ event: 'login_failed_unverified_user', emailHash: hashEmail(normalizedEmail), ip: req.ip, userId: user.id });
      return res.status(403).json({ message: 'Debe verificar su correo antes de iniciar sesion' });
    }

    setAuthCookies(res, user);
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

    if (!user) return res.json(genericResponse);

    const token = generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetTokenExpiry();
    await user.save();

    await sendResetPasswordEmail(user, token);
    logger.info({ event: 'password_reset_requested', userId: user.id, emailHash: hashEmail(user.email), ip: req.ip });

    return res.json(genericResponse);
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      logger.warn({ event: 'refresh_failed_no_cookie', ip: req.ip, cookies: Object.keys(req.cookies || {}) });
      return res.status(401).json({ message: 'Sesión inválida' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (verifyError) {
      logger.warn({ event: 'refresh_failed_invalid_token', ip: req.ip, reason: verifyError.message });
      return res.status(401).json({ message: 'Token inválido' });
    }

    if (payload.type !== 'refresh') {
      logger.warn({ event: 'refresh_failed_wrong_type', ip: req.ip, type: payload.type });
      return res.status(401).json({ message: 'Token inválido' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user || !user.activo) {
      clearAuthCookies(res);
      logger.warn({ event: 'refresh_failed_user_invalid', ip: req.ip, userId: payload.sub });
      return res.status(401).json({ message: 'Sesión inválida' });
    }

    setAuthCookies(res, user);
    logger.info({ event: 'refresh_success', userId: user.id, ip: req.ip });
    return res.json({ user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  clearAuthCookies(res);
  return res.json({ message: 'Sesión cerrada' });
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

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    logger.info({ event: 'password_reset_completed', userId: user.id, emailHash: hashEmail(user.email), ip: req.ip });

    return res.json({ message: 'Contrasena actualizada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

export { register, login, verifyEmail, forgotPassword, resetPassword, refresh, logout };
