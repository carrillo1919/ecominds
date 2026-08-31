const isProduction = process.env.NODE_ENV === 'production';

/**
 * Opciones comunes para cookies HttpOnly usadas en autenticación.
 */
const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: maxAgeMs,
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined,
});

const COOKIE_NAMES = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  csrfToken: 'csrf_token',
};

export { cookieOptions, COOKIE_NAMES, isProduction };
