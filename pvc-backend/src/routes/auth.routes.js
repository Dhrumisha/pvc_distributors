// src/routes/auth.routes.js
const router     = require('express').Router();
const rateLimit  = require('express-rate-limit');
const auth       = require('../middleware/auth');
const validate   = require('../middleware/validate');
const ctrl       = require('../controllers/auth.controller');
const schemas    = require('../validators/auth.schema');

// Stricter rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX       || '10'),
  message:  { success: false, message: 'Too many attempts. Try again later.' },
});

router.post  ('/login',            authLimiter, validate(schemas.login),           ctrl.login);
router.post  ('/refresh',          authLimiter,                                     ctrl.refresh);
router.post  ('/logout',           auth,                                            ctrl.logout);
router.post  ('/forgot-password',  authLimiter, validate(schemas.forgotPassword),  ctrl.forgotPassword);
router.post  ('/reset-password',   authLimiter, validate(schemas.resetPassword),   ctrl.resetPassword);
router.post  ('/set-password',     validate(schemas.setPassword),                  ctrl.setPassword);  // public — token based
router.get   ('/verify-token',                                                       ctrl.verifyToken);  // public — just checks token validity
router.patch ('/change-password',  auth,        validate(schemas.changePassword),   ctrl.changePassword);
router.get   ('/me',               auth,                                            ctrl.me);
router.patch ('/me',               auth,        validate(schemas.updateMe),         ctrl.updateMe);

module.exports = router;
