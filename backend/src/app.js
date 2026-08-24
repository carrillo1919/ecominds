const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((item) => item.trim()).filter(Boolean)
  : '*';

app.use(cors({ origin: corsOrigin.length === 0 ? '*' : corsOrigin }));
app.use(express.json());
app.use('/api', routes);

module.exports = app;
