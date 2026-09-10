import crypto from 'node:crypto';

const generateToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const resetTokenExpiry = () =>
  new Date(Date.now() + RESET_TOKEN_TTL_MS);

export {
  generateToken,
  resetTokenExpiry,
  RESET_TOKEN_TTL_MS,
};
