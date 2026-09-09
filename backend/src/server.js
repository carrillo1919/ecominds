import 'dotenv/config';

import logger from './utils/logger.js';

const PORT = Number(process.env.PORT);

const validateStartupConfig = () => {
  const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CSRF_SECRET', 'DATABASE_URL'];
  const missingVars = requiredVars.filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET debe tener al menos 32 caracteres en producción');
    }
    if (process.env.CSRF_SECRET.length < 32) {
      throw new Error('CSRF_SECRET debe tener al menos 32 caracteres en producción');
    }
  }
};

const start = async () => {
  try {
    validateStartupConfig();

    const [
      { default: app },
      { sequelize },
      { verifyEmailConnection },
      { default: documentosVencimientoJob },
      { default: auditoriaHoyJob },
      { default: serviciosRecordatorioJob },
    ] = await Promise.all([
      import('./app.js'),
      import('./models/index.js'),
      import('./services/emailService.js'),
      import('./jobs/documentosVencimientoJob.js'),
      import('./jobs/auditoriaHoyJob.js'),
      import('./jobs/serviciosRecordatorioJob.js'),
    ]);

    await sequelize.authenticate();
    logger.info('[db] Conexion establecida');

    await verifyEmailConnection();

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

    documentosVencimientoJob();
    auditoriaHoyJob();
    serviciosRecordatorioJob();
  } catch (error) {
    logger.error({ event: 'server_start_failed', message: '[server] No se pudo iniciar', error: error.message });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => logger.error({ event: 'unhandled_rejection', reason }));
process.on('uncaughtException', (error) => logger.error({ event: 'uncaught_exception', error: error.message, stack: error.stack }));

start();