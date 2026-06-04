// src/controllers/auth.controller.js
'use strict';

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../config/db');
const logger   = require('../config/logger');
const AppError = require('../utils/AppError');
const { ok }   = require('../utils/response');
const { getPermissionsForUser } = require('../services/permissions.service');
const emailService = require('../services/email.service');

const signAccess  = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
const signRefresh = (p) => jwt.sign(p, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
const BCRYPT_ROUNDS = () => parseInt(process.env.BCRYPT_ROUNDS || '12');

const isProd = () => process.env.NODE_ENV === 'production';
// In production the UI (Vercel) and API (Render) live on DIFFERENT domains, so the
// refresh cookie must be SameSite=None + Secure to be sent on cross-site requests.
// In dev we use 'lax' so localhost cross-port works without HTTPS.
const refreshCookieOpts = (withMaxAge = true) => ({
  httpOnly: true,
  secure:   isProd(),
  sameSite: isProd() ? 'none' : 'lax',
  path:     '/',
  ...(withMaxAge ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
});

const buildPayload = async (user) => {
  const { roles, permissions } = await getPermissionsForUser(user.id);
  return { id: user.id, email: user.email, name: user.name, roles, permissions, must_set_password: !!user.must_set_password };
};

// POST /auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await db('auth_users').where({ email }).whereNull('deleted_at').first();
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    throw new AppError('Invalid email or password.', 401);
  if (!user.is_active)
    throw new AppError('Account disabled. Contact your administrator.', 403);
  const payload = await buildPayload(user);
  const token   = signAccess(payload);
  const refresh = signRefresh({ id: user.id });
  await db('auth_users').where({ id: user.id }).update({ last_login_at: new Date(), updated_at: new Date() });
  // Refresh token in HTTP-only cookie (7 days)
  res.cookie('refreshToken', refresh, refreshCookieOpts());
  logger.info(`Login: ${email} [${req.ip}]`);
  return ok(res, { token, user: { ...payload, phone: user.phone, avatar_url: user.avatar_url } });
};

// POST /auth/refresh
exports.refresh = async (req, res) => {
  const rt = req.cookies?.refreshToken;
  if (!rt) throw new AppError('No refresh token. Please log in again.', 401);
  let decoded;
  try {
    decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new AppError('Session expired. Please log in again.', 401);
  }
  const user = await db('auth_users').where({ id: decoded.id, is_active: 1 }).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found.', 401);
  const payload = await buildPayload(user);
  const newToken = signAccess(payload);
  return ok(res, { token: newToken });
};

// POST /auth/logout
exports.logout = async (req, res) => {
  res.clearCookie('refreshToken', refreshCookieOpts(false));
  return ok(res, null, 'Logged out successfully.');
};

// POST /auth/forgot-password
// FIX: now returns a proper error if email sending fails (in dev mode)
// so you can see what went wrong instead of silently failing.
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Check if SMTP is configured at all
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.error('[ForgotPassword] SMTP_USER or SMTP_PASS not set in .env — cannot send email');
    // In development, expose this as an error so the developer knows
    if (process.env.NODE_ENV !== 'production') {
      throw new AppError(
        'Email is not configured on the server. Set SMTP_USER and SMTP_PASS in your .env file.',
        503
      );
    }
  }

  const user = await db('auth_users').where({ email }).whereNull('deleted_at').first();

  if (user) {
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('auth_users').where({ id: user.id }).update({
      password_reset_token:   token,
      password_reset_expires: expires,
      updated_at:             new Date(),
    });

    try {
      await emailService.sendPasswordReset({ to: user.email, name: user.name, token });
      logger.info(`[ForgotPassword] Reset email sent to: ${email}`);
    } catch (e) {
      logger.error(`[ForgotPassword] Email send FAILED for ${email}: ${e.message}`);
      // In development, expose the real error so you can debug it
      if (process.env.NODE_ENV !== 'production') {
        throw new AppError(`Email sending failed: ${e.message}. Check SMTP settings in .env`, 503);
      }
      // In production, stay silent (don't reveal if email exists)
    }
  } else {
    logger.warn(`[ForgotPassword] No account found for: ${email}`);
  }

  return ok(res, null, 'If that email is registered, a reset link has been sent.');
};

// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  const user = await db('auth_users')
    .where('password_reset_token', token)
    .where('password_reset_expires', '>', new Date())
    .whereNull('deleted_at')
    .first();
  if (!user) throw new AppError('Reset link is invalid or has expired. Please request a new one.', 400);
  const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS());
  await db('auth_users').where({ id: user.id }).update({
    password_hash:          hash,
    password_reset_token:   null,
    password_reset_expires: null,
    must_set_password:      false,
    updated_at:             new Date(),
  });
  try { await emailService.sendPasswordChangedNotice({ to: user.email, name: user.name }); } catch (e) { logger.warn(e.message); }
  logger.info(`[ResetPassword] Password reset for: ${user.email}`);
  return ok(res, null, 'Password reset successfully. You can now sign in.');
};

// POST /auth/set-password
exports.setPassword = async (req, res) => {
  const { token, password } = req.body;
  let user;
  if (token) {
    user = await db('auth_users')
      .where('invite_token', token)
      .where('invite_token_expires', '>', new Date())
      .whereNull('deleted_at')
      .first();
    if (!user) throw new AppError('Invite link is invalid or has expired. Ask your admin to resend.', 400);
  } else {
    if (!req.user) throw new AppError('Authentication required.', 401);
    user = await db('auth_users').where({ id: req.user.id }).first();
    if (!user) throw new AppError('User not found.', 404);
  }
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS());
  await db('auth_users').where({ id: user.id }).update({
    password_hash:        hash,
    invite_token:         null,
    invite_token_expires: null,
    must_set_password:    false,
    is_active:            1,
    status:               'ACTIVE',
    updated_at:           new Date(),
  });
  try { await emailService.sendPasswordChangedNotice({ to: user.email, name: user.name }); } catch (e) { logger.warn(e.message); }
  return ok(res, null, 'Password set successfully. You can now sign in.');
};

// GET /auth/verify-token
exports.verifyToken = async (req, res) => {
  const { token, type } = req.query;
  if (!token) throw new AppError('Token is required.', 400);
  let user;
  if (type === 'invite') {
    user = await db('auth_users').where('invite_token', token).where('invite_token_expires', '>', new Date()).whereNull('deleted_at').first();
  } else {
    user = await db('auth_users').where('password_reset_token', token).where('password_reset_expires', '>', new Date()).whereNull('deleted_at').first();
  }
  if (!user) throw new AppError('Token is invalid or has expired.', 400);
  return ok(res, { valid: true, email: user.email, name: user.name });
};

// PATCH /auth/change-password
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await db('auth_users').where({ id: req.user.id }).first();
  if (!user) throw new AppError('User not found.', 404);
  if (!(await bcrypt.compare(current_password, user.password_hash)))
    throw new AppError('Current password is incorrect.', 400);
  const hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS());
  await db('auth_users').where({ id: user.id }).update({ password_hash: hash, updated_at: new Date() });
  try { await emailService.sendPasswordChangedNotice({ to: user.email, name: user.name }); } catch (e) { logger.warn(e.message); }
  return ok(res, null, 'Password changed successfully.');
};

// GET /auth/me
exports.me = async (req, res) => {
  const user = await db('auth_users')
    .select('id','name','email','phone','avatar_url','is_active','must_set_password','last_login_at','created_at')
    .where({ id: req.user.id })
    .whereNull('deleted_at')
    .first();
  if (!user) throw new AppError('User not found.', 404);
  const { roles, permissions } = await getPermissionsForUser(user.id);
  return ok(res, { user: { ...user, roles, permissions } });
};

// PATCH /auth/me
exports.updateMe = async (req, res) => {
  const { name, phone, avatar_url } = req.body;
  const [user] = await db('auth_users')
    .where({ id: req.user.id })
    .update({ name, phone, avatar_url, updated_at: new Date() })
    .returning(['id','name','email','phone','avatar_url']);
  return ok(res, { user });
};
