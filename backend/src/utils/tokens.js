import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const resetTokenExpiry = () => new Date(Date.now() + RESET_TOKEN_TTL_MS);

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, rol: user.rol }, process.env.JWT_SECRET, {
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
  });

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: 'refresh', jti: generateToken(16) },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: Math.floor(REFRESH_TOKEN_TTL_MS / 1000) }
  );

export {
  generateToken,
  resetTokenExpiry,
  signAccessToken,
  signRefreshToken,
  RESET_TOKEN_TTL_MS,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
};
