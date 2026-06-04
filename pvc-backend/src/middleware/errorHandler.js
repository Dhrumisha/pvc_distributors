// src/middleware/errorHandler.js
const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal Server Error';
  const errors  = err.errors     || [];

  // Log 5xx errors with full stack; 4xx are just warnings
  if (status >= 500) {
    logger.error(`${req.method} ${req.path} → ${status}: ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.path} → ${status}: ${message}`);
  }

  // PostgreSQL constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value — a record with this identifier already exists.',
      errors:  [{ field: err.detail, msg: 'Duplicate' }],
    });
  }
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
