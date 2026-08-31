import 'dotenv/config';

import app from './app.js';
import { sequelize } from './models/index.js';
import { verifyResendConnection } from './services/emailService.js';
import logger from './utils/logger.js';

const PORT = Number(process.env.PORT || 3000);

// Validación de secretos críticos antes de arrancar.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 caracteres');
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET es obligatorio y debe tener al menos 32 caracteres');
}

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('[db] Conexion establecida');

    await verifyResendConnection();

    app.listen(PORT, () => {
      const isProduction = process.env.NODE_ENV === 'production';

      const publicUrl = isProduction
        ? process.env.PUBLIC_URL || `http://localhost:${PORT}`
        : `http://localhost:${PORT}`;

      if (isProduction && !process.env.PUBLIC_URL) {
        logger.warn('[server] PUBLIC_URL no está definida. La URL mostrada no será accesible desde internet.');
      }

      logger.info(`[server] EcoMinds API escuchando en ${publicUrl}`);
    });
  } catch (error) {
    logger.error({ err: error }, '[server] No se pudo iniciar');
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => logger.error({ reason }, '[unhandledRejection]'));
process.on('uncaughtException', (error) => logger.error({ err: error }, '[uncaughtException]'));

start();
