const env = require('../config/env');

function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// Errors with an explicit `status` (or multer's own errors) are intentional,
// user-facing rejections raised by a controller/service — e.g. "Select a
// client." — and their message is always safe to show as-is. Anything else
// (status defaults to 500) is unexpected: a bug, a DB error, a missing
// column, etc. Its raw message can contain internal detail (SQL, column
// names, stack-trace-adjacent text) that isn't meaningful to whoever's
// looking at the screen and shouldn't be exposed — so it's logged here for
// whoever's debugging, and the client gets a generic message instead
// (except in development, where seeing the real error locally is worth more
// than hiding it).
function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);

  if (status >= 500) {
    console.error(err);
  }

  const message =
    status < 500 || env.nodeEnv === 'development'
      ? err.message || 'Internal server error'
      : 'Something went wrong on our end. Please try again, and contact support if it keeps happening.';

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
