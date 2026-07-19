// .env.local holds real local dev secrets and only exists on a dev machine
// (it's gitignored, so it's never present in a git-based deploy). In
// production, the host (Render, etc.) injects real env vars directly into
// the process — this call finds nothing there and is a harmless no-op.
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env.local') });

module.exports = {
  port: process.env.PORT || 5000,
  httpsPort: process.env.HTTPS_PORT || 5443,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Comma-separated in production so the Vercel production domain and any
  // custom domain can both be whitelisted, e.g.
  // "https://refurbinics.vercel.app,https://app.refurbinics.com".
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim()),
  db: {
    // Set by managed Postgres providers (Render/Railway/Supabase/Neon/etc.)
    // as a single connection string. Takes priority over the discrete
    // DB_HOST/DB_PORT/... fields below, which exist for local dev against a
    // plain, non-SSL Postgres install. See db.js for how the two are used.
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
