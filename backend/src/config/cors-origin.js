const env = require('./env');

// Allow requests from:
//   - No origin (server-to-server / curl)
//   - Any port-5173 origin in development (localhost, 127.0.0.1, LAN IP)
//   - The configured CLIENT_URL origin(s) in production (comma-separated)
//   - Any Vercel preview URL matching refurbinics*.vercel.app (these change
//     on every push, so a static string can never match them all)
// Shared between the Express CORS middleware (app.js) and the Socket.IO
// server (realtime/index.js) so both accept exactly the same origins.
const vercelPreviewOrigin = /^https:\/\/refurbinics[a-z0-9-]*\.vercel\.app$/i;
const dev5173Origin = /^https?:\/\/[^/]+:5173$/;

function corsOrigin(origin, callback) {
  // Allow requests with no origin (e.g. server-to-server, curl)
  if (!origin) return callback(null, true);
  // Dev-only relaxation — any host on port 5173 is trusted locally for
  // convenience, but never in production, where that would widen the
  // allowed-origin list to anything a developer happens to run on 5173.
  if (env.nodeEnv !== 'production' && dev5173Origin.test(origin)) return callback(null, true);
  // Vercel preview URLs change on every push and are exercised against the
  // live backend (not just local dev), so this stays allowed in production.
  if (vercelPreviewOrigin.test(origin)) return callback(null, true);
  // Allow explicitly configured CLIENT_URL(s)
  if (env.clientUrls.includes(origin)) return callback(null, true);
  // Block everything else
  return callback(new Error(`CORS: origin ${origin} not allowed`));
}

module.exports = { corsOrigin };
