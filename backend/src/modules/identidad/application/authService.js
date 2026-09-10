import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User } from '../../../models/index.js';
import { sendVerificationEmail, sendResetPasswordEmail } from './emailService.js';
import HttpError from '../../../shared/http/errors/http-error.js';
import logger from '../../../shared/observability/logger.js';

const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
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

export const registrarUsuario = async ({ nombre, apellido, email, password }) => {
  const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    throw new HttpError(409, 'El correo ya se encuentra registrado');
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
  return user;
};

export const autenticarUsuario = async ({ email, password }, ip) => {
  const normalizedEmail = String(email).toLowerCase();

  const user = await User.scope('withSecrets').findOne({
    where: { email: normalizedEmail },
  });

  if (!user || !(await user.comparePassword(password))) {
    logger.warn({ event: 'login_failed', emailHash: hashEmail(normalizedEmail), ip });
    throw new HttpError(401, 'Credenciales invalidas');
  }

  if (!user.activo) {
    logger.warn({ event: 'login_failed_inactive_user', emailHash: hashEmail(normalizedEmail), ip, userId: user.id });
    throw new HttpError(403, 'Su usuario esta desactivado. Contacte al administrador.');
  }

  if (!user.verified) {
    logger.warn({ event: 'login_failed_unverified_user', emailHash: hashEmail(normalizedEmail), ip, userId: user.id });
    throw new HttpError(403, 'Debe verificar su correo antes de iniciar sesion');
  }

  return user;
};

export const verificarEmail = async (token) => {
  if (!token) {
    throw new HttpError(400, 'Token no proporcionado');
  }

  const user = await User.scope('withSecrets').findOne({ where: { verificationToken: token } });

  if (!user) {
    throw new HttpError(400, 'El enlace de verificacion es invalido o ya fue utilizado');
  }

  user.verified = true;
  user.verificationToken = null;
  await user.save();
  return user;
};

export const solicitarRestablecimiento = async ({ email }, ip) => {
  const genericResponse = {
    message: 'Si el correo existe en el sistema, recibira un enlace para restablecer su contrasena.',
  };

  const user = await User.scope('withSecrets').findOne({
    where: { email: String(email).toLowerCase() },
  });

  if (!user) return genericResponse;

  const token = generateToken();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = resetTokenExpiry();
  await user.save();

  await sendResetPasswordEmail(user, token);
  logger.info({ event: 'password_reset_requested', userId: user.id, emailHash: hashEmail(user.email), ip });

  return genericResponse;
};

export const refrescarSesion = async (token, ip) => {
  if (!token) {
    logger.warn({ event: 'refresh_failed_no_cookie', ip });
    throw new HttpError(401, 'Sesión inválida');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (verifyError) {
    logger.warn({ event: 'refresh_failed_invalid_token', ip, reason: verifyError.message });
    throw new HttpError(401, 'Token inválido');
  }

  if (payload.type !== 'refresh') {
    logger.warn({ event: 'refresh_failed_wrong_type', ip, type: payload.type });
    throw new HttpError(401, 'Token inválido');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.activo) {
    logger.warn({ event: 'refresh_failed_user_invalid', ip, userId: payload.sub });
    throw new HttpError(401, 'Sesión inválida');
  }

  logger.info({ event: 'refresh_success', userId: user.id, ip });
  return user;
};

export const restablecerPassword = async ({ token, password }, ip) => {
  const user = await User.scope('withSecrets').findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new HttpError(400, 'El enlace es invalido o ha expirado');
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  logger.info({ event: 'password_reset_completed', userId: user.id, emailHash: hashEmail(user.email), ip });
  return user;
};

export const emitirCookies = (res, user) => setAuthCookies(res, user);
export const limpiarCookies = (res) => clearAuthCookies(res);