import 'dotenv/config';

import app from './app.js';
import { sequelize } from './models/index.js';
import { verifyResendConnection } from './services/emailService.js';

const PORT = Number(process.env.PORT );

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[db] Conexion establecida');

    await verifyResendConnection();

    app.listen(PORT, () => {
      const isProduction = process.env.NODE_ENV === 'production';

      const publicUrl = isProduction
        ? process.env.PUBLIC_URL || `http://localhost:${PORT}`
        : `http://localhost:${PORT}`;

      if (isProduction && !process.env.PUBLIC_URL) {
        console.warn('[server] PUBLIC_URL no está definida. La URL mostrada no será accesible desde internet.');
      }

      console.log(`[server] EcoMinds API escuchando en ${publicUrl}`);
    });
  } catch (error) {
    console.error('[server] No se pudo iniciar:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (error) => console.error('[uncaughtException]', error));

start();