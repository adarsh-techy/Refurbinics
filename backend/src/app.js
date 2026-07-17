const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error-handler');

const app = express();

// In development, the frontend gets reached from more than one origin —
// localhost, 127.0.0.1, and whatever LAN IP a phone/other device on the
// network uses to hit the Vite dev server — so any origin on port 5173 is
// allowed rather than the single hardcoded CLIENT_URL. Production stays
// locked to the one configured origin.
const corsOrigin =
  env.nodeEnv === 'development'
    ? (origin, callback) => callback(null, !origin || /^https?:\/\/[^/]+:5173$/.test(origin))
    : env.clientUrl;

app.use(cors({ origin: corsOrigin }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
