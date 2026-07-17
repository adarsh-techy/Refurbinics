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
// allowed rather than the single hardcoded CLIENT_URL.
//
// In production, Vercel serves the same deployment from more than one
// origin too: the configured production domain(s) in CLIENT_URL, plus a
// per-branch/per-deployment "*.vercel.app" URL that changes on every push
// (e.g. refurbinics-git-main-adarsh-techys-projects.vercel.app). A plain
// string origin can't reflect the actual request origin, so the CORS
// middleware always sent back CLIENT_URL's value and the browser rejected
// it whenever the visited URL didn't match exactly. Validating against an
// allowlist (+ that Vercel URL pattern) fixes it for every such origin,
// not just today's.
const vercelPreviewOrigin = /^https:\/\/refurbinics(-[a-z0-9-]+)?\.vercel\.app$/;

const corsOrigin =
  env.nodeEnv === 'development'
    ? (origin, callback) => callback(null, !origin || /^https?:\/\/[^/]+:5173$/.test(origin))
    : (origin, callback) =>
        callback(null, !origin || env.clientUrls.includes(origin) || vercelPreviewOrigin.test(origin));

app.use(cors({ origin: corsOrigin }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
