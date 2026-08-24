const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((item) => item.trim()).filter(Boolean)
  : [];
const corsOrigin = configuredOrigins.length > 0 ? configuredOrigins : ['http://localhost:5173'];

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/api', routes);

module.exports = app;
