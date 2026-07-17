function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  // multer's built-in errors (file too large, etc.) are client mistakes.
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = { notFound, errorHandler };
