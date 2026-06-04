// src/middleware/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// JWT verification middleware.
// Attaches decoded payload (id, email, roles, permissions) to req.user.
// ─────────────────────────────────────────────────────────────────────────────
const jwt    = require('jsonwebtoken');
const AppError = require('../utils/AppError');

module.exports = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. No token provided.', 401));
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired. Please refresh.', 401));
    return next(new AppError('Invalid token.', 401));
  }
};
