const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error-handler');

const app = express();

// Allow requests from:
//   - No origin (server-to-server / curl)
//   - Any port-5173 origin in development (localhost, 127.0.0.1, LAN IP)
//   - The configured CLIENT_URL origin(s) in production (comma-separated)
//   - Any Vercel preview URL matching refurbinics*.vercel.app (these change
//     on every push, so a static string can never match them all)
const vercelPreviewOrigin = /^https:\/\/refurbinics[a-z0-9-]*\.vercel\.app$/i;
const dev5173Origin = /^https?:\/\/[^/]+:5173$/;

const corsOrigin = (origin, callback) => {
  // Allow requests with no origin (e.g. server-to-server, curl)
  if (!origin) return callback(null, true);
  // Allow local Vite dev server on any host
  if (dev5173Origin.test(origin)) return callback(null, true);
  // Allow any Vercel preview / production URL for this project
  if (vercelPreviewOrigin.test(origin)) return callback(null, true);
  // Allow explicitly configured CLIENT_URL(s)
  if (env.clientUrls.includes(origin)) return callback(null, true);
  // Block everything else
  return callback(new Error(`CORS: origin ${origin} not allowed`));
};

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
