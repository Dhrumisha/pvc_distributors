// src/middleware/rbac.js
// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control middleware.
// Usage: router.get('/path', auth, rbac('inventory', 'view'), controller)
//
// Checks req.user.permissions (flat array of "module.action" strings set at login).
// Admin role bypasses all permission checks.
// ─────────────────────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');

const rbac = (module, action) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required.', 401));

  const roles       = req.user.roles || [];
  const permissions = req.user.permissions || [];

  // Admin bypasses all checks
  if (roles.includes('Admin')) return next();

  const required = `${module}.${action}`;
  if (!permissions.includes(required)) {
    return next(new AppError(
      `Access denied. Required permission: ${required}`,
      403
    ));
  }
  next();
};

module.exports = rbac;
