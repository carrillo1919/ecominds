import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService.js';

const signToken = (user) =>
  jwt.sign({ sub: user.id, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

const generateToken = () => crypto.randomBytes(32).toString('hex');

const resetTokenExpiry = () => new Date(Date.now() + 60 * 60 * 1000); // 1 hora

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

    const user = await User.scope('withSecrets').findOne({
      where: { email: String(email).toLowerCase() },
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    if (!user.activo) {
      return res.status(403).json({ message: 'Su usuario esta desactivado. Contacte al administrador.' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Debe verificar su correo antes de iniciar sesion' });
    }

    return res.json({ token: signToken(user), user: user.toPublicJSON() });
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

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: 'Contrasena actualizada correctamente. Ya puede iniciar sesion.' });
  } catch (error) {
    return next(error);
  }
};

export { register, login, verifyEmail, forgotPassword, resetPassword };
