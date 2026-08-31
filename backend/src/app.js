import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      // No se lanza error: se responde sin cabeceras CORS y el navegador bloquea la peticion.
      console.warn(`[cors] Origen no permitido: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
