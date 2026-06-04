// src/controllers/users.controller.js
'use strict';

const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const db       = require('../config/db');
const AppError = require('../utils/AppError');
const logger   = require('../config/logger');
const { ok, created, noContent, paginate } = require('../utils/response');
const { invalidatePermissionCache } = require('../services/permissions.service');
const emailService = require('../services/email.service');

const BCRYPT_ROUNDS = () => parseInt(process.env.BCRYPT_ROUNDS || '12');
const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// GET /users
exports.list = async (req, res) => {
  const { page=1, limit=20, search, status } = req.query;
  const offset = (page-1)*limit;
  let q = db('auth_users').whereNull('deleted_at');
  if (search) q = q.where(b => b.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`));
  if (status) q = q.where('status', status);
  const [{ count }] = await q.clone().count('id as count');
  const users = await q.clone()
    .select('id','name','email','phone','is_active','status','must_set_password','last_login_at','created_at')
    .orderBy('created_at','desc').limit(limit).offset(offset);

  // Attach roles for each user
  const userIds = users.map(u => u.id);
  const roleRows = userIds.length
    ? await db('auth_user_roles as ur').join('auth_roles as r','r.id','ur.role_id').whereIn('ur.user_id', userIds).select('ur.user_id','r.id','r.name')
    : [];
  const roleMap = roleRows.reduce((m, r) => { (m[r.user_id] = m[r.user_id] || []).push({ id: r.id, name: r.name }); return m; }, {});
  const usersWithRoles = users.map(u => ({ ...u, roles: roleMap[u.id] || [] }));

  return paginate(res, { users: usersWithRoles }, { page, limit, total: count });
};

// POST /users — creates user + sends invite email (no password required from admin)
exports.create = async (req, res) => {
  const { name, email, phone, role_ids = [] } = req.body;

  const exists = await db('auth_users').where({ email }).whereNull('deleted_at').first();
  if (exists) throw new AppError('A user with this email already exists.', 409);

  // Generate a random invite token (no password set yet)
  const inviteToken   = crypto.randomBytes(32).toString('hex');
  const inviteExpires = new Date(Date.now() + INVITE_TTL_MS);

  // Placeholder password hash (user can't log in until they set their real password)
  const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_ROUNDS());

  const [user] = await db('auth_users').insert({
    name,
    email,
    phone:                phone || null,
    password_hash:        placeholderHash,
    invite_token:         inviteToken,
    invite_token_expires: inviteExpires,
    must_set_password:    true,
    is_active:            0,           // activated when they set their password
    status:               'INVITED',
    ip_address:           req.ip,
    created_by:           req.user.id,
    created_at:           new Date(),
    updated_at:           new Date(),
  }).returning(['id','name','email','phone','is_active','status','must_set_password','created_at']);

  // Assign roles
  if (role_ids.length) {
    await db('auth_user_roles').insert(
      role_ids.map(rid => ({ user_id: user.id, role_id: rid, assigned_by: req.user.id, created_at: new Date() }))
    );
  }

  // Fetch role names for the email
  const roleNames = role_ids.length
    ? (await db('auth_roles').whereIn('id', role_ids).pluck('name'))
    : [];

  // Get inviting admin's name
  const inviter = await db('auth_users').where({ id: req.user.id }).first();

  // Send invite email — non-blocking (failure doesn't break the response)
  try {
    await emailService.sendInvite({
      to:        email,
      name,
      invitedBy: inviter?.name || 'Administrator',
      roles:     roleNames,
      token:     inviteToken,
    });
    logger.info(`Invite email sent to: ${email}`);
  } catch (e) {
    logger.error(`Invite email FAILED for ${email}: ${e.message}`);
    // Still return 201 — admin sees user was created, can resend manually
  }

  return created(res, { user, invite_sent: true });
};

// GET /users/:id
exports.getOne = async (req, res) => {
  const user = await db('auth_users')
    .select('id','name','email','phone','is_active','status','must_set_password','avatar_url','last_login_at','created_at')
    .where({ id: req.params.id }).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found.', 404);
  const roles = await db('auth_user_roles as ur').join('auth_roles as r','r.id','ur.role_id').where('ur.user_id', user.id).select('r.id','r.name','r.slug');
  return ok(res, { user, roles });
};

// PUT /users/:id
exports.update = async (req, res) => {
  const { name, phone, is_active, avatar_url } = req.body;
  const [user] = await db('auth_users').where({ id: req.params.id }).whereNull('deleted_at')
    .update({ name, phone, is_active, avatar_url, updated_by: req.user.id, updated_at: new Date() })
    .returning(['id','name','email','phone','is_active']);
  if (!user) throw new AppError('User not found.', 404);
  return ok(res, { user });
};

// PATCH /users/:id/status
exports.setStatus = async (req, res) => {
  const { status } = req.body;
  const is_active = status === 'ACTIVE' ? 1 : 0;
  const [user] = await db('auth_users').where({ id: req.params.id })
    .update({ status, is_active, updated_by: req.user.id, updated_at: new Date() })
    .returning(['id','name','email','is_active','status']);
  if (!user) throw new AppError('User not found.', 404);
  await invalidatePermissionCache(req.params.id);
  return ok(res, { user });
};

// DELETE /users/:id
exports.remove = async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    throw new AppError('Cannot delete your own account.', 400);
  await db('auth_users').where({ id: req.params.id }).update({ deleted_at: new Date() });
  await invalidatePermissionCache(req.params.id);
  return noContent(res);
};

// POST /users/:id/roles
exports.assignRoles = async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role_ids = [] } = req.body;
  await db('auth_user_roles').where({ user_id: userId }).delete();
  if (role_ids.length) {
    await db('auth_user_roles').insert(
      role_ids.map(rid => ({ user_id: userId, role_id: rid, assigned_by: req.user.id, created_at: new Date() }))
    );
  }
  await invalidatePermissionCache(userId);
  const roles = await db('auth_user_roles as ur').join('auth_roles as r','r.id','ur.role_id').where('ur.user_id', userId).select('r.id','r.name');
  return ok(res, { roles }, 'Roles updated.');
};

// DELETE /users/:id/roles/:roleId
exports.removeRole = async (req, res) => {
  await db('auth_user_roles').where({ user_id: req.params.id, role_id: req.params.roleId }).delete();
  await invalidatePermissionCache(req.params.id);
  return noContent(res);
};

// POST /users/:id/resend-invite — generates fresh token, resends email
exports.resendInvite = async (req, res) => {
  const user = await db('auth_users').where({ id: req.params.id }).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found.', 404);

  const inviteToken   = crypto.randomBytes(32).toString('hex');
  const inviteExpires = new Date(Date.now() + INVITE_TTL_MS);

  await db('auth_users').where({ id: user.id }).update({
    invite_token:         inviteToken,
    invite_token_expires: inviteExpires,
    must_set_password:    true,
    status:               'INVITED',
    updated_at:           new Date(),
  });

  const roleNames = (await db('auth_user_roles as ur').join('auth_roles as r','r.id','ur.role_id').where('ur.user_id', user.id).pluck('r.name'));
  const inviter   = await db('auth_users').where({ id: req.user.id }).first();

  try {
    await emailService.resendInvite({
      to:        user.email,
      name:      user.name,
      invitedBy: inviter?.name || 'Administrator',
      roles:     roleNames,
      token:     inviteToken,
    });
    logger.info(`Invite resent to: ${user.email}`);
  } catch (e) {
    logger.error(`Resend invite FAILED for ${user.email}: ${e.message}`);
    throw new AppError('Failed to send invite email. Check SMTP settings in .env', 500);
  }

  return ok(res, null, `Invite resent to ${user.email}.`);
};
