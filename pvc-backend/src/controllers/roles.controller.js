// src/controllers/roles.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent } = require('../utils/response');
const { invalidatePermissionCache } = require('../services/permissions.service');

exports.list = async (_req, res) => {
  const roles = await db('auth_roles').orderBy('name');
  return ok(res, { roles });
};
exports.create = async (req, res) => {
  const { name, slug, description } = req.body;
  const [role] = await db('auth_roles').insert({ name, slug, description, status:'ACTIVE', is_system:0, created_at: new Date() }).returning('*');
  return created(res, { role });
};
exports.getOne = async (req, res) => {
  const role = await db('auth_roles').where({ id: req.params.id }).first();
  if (!role) throw new AppError('Role not found.', 404);
  return ok(res, { role });
};
exports.update = async (req, res) => {
  const [role] = await db('auth_roles').where({ id: req.params.id, is_system: 0 }).update({ name: req.body.name, description: req.body.description, updated_at: new Date() }).returning('*');
  if (!role) throw new AppError('Role not found or is a system role.', 404);
  return ok(res, { role });
};
exports.remove = async (req, res) => {
  const deleted = await db('auth_roles').where({ id: req.params.id, is_system: 0 }).delete();
  if (!deleted) throw new AppError('Role not found or is a system role.', 404);
  return noContent(res);
};
exports.getPermissions = async (req, res) => {
  const perms = await db('auth_roles_permissions_mapping as rpm').join('auth_module_actions as ma','ma.id','rpm.module_action_id').join('auth_modules as m','m.id','ma.module_id').where('rpm.role_id', req.params.id).select('rpm.id','m.code as module','m.label as module_label','ma.action','ma.label as action_label');
  return ok(res, { permissions: perms });
};
exports.addPermissions = async (req, res) => {
  const roleId = req.params.id;
  const { module_action_ids = [] } = req.body;
  if (!Array.isArray(module_action_ids) || module_action_ids.length === 0)
    throw new AppError('No permissions provided.', 400);

  // Each mapping row needs both module_action_id AND permission_id (NOT NULL).
  // Resolve permission_id by matching module code + action.
  const resolved = await db('auth_module_actions as ma')
    .join('auth_modules as m', 'm.id', 'ma.module_id')
    .join('auth_permissions as p', function () {
      this.on('p.resource', 'm.code').andOn('p.action', 'ma.action');
    })
    .whereIn('ma.id', module_action_ids)
    .select('ma.id as module_action_id', 'p.id as permission_id');

  if (!resolved.length) throw new AppError('No matching permissions found.', 400);

  const rows = resolved.map(r => ({
    role_id:          roleId,
    permission_id:    r.permission_id,
    module_action_id: r.module_action_id,
    granted_by:       req.user.id,
    created_at:       new Date(),
  }));

  // Unique constraint is on (role_id, permission_id).
  await db('auth_roles_permissions_mapping').insert(rows).onConflict(['role_id', 'permission_id']).ignore();

  // Invalidate cache for all users with this role
  const userIds = await db('auth_user_roles').where({ role_id: roleId }).pluck('user_id');
  await Promise.all(userIds.map(id => invalidatePermissionCache(id)));
  return ok(res, null, 'Permissions granted');
};
exports.removePermission = async (req, res) => {
  await db('auth_roles_permissions_mapping').where({ id: req.params.pid }).delete();
  const userIds = await db('auth_user_roles').where({ role_id: req.params.id }).pluck('user_id');
  await Promise.all(userIds.map(id => invalidatePermissionCache(id)));
  return noContent(res);
};
exports.matrix = async (_req, res) => {
  const roles = await db('auth_roles').orderBy('name');
  const actions = await db('auth_module_actions as ma').join('auth_modules as m','m.id','ma.module_id').orderBy(['m.sort_order','ma.action']).select('ma.id','m.code','m.label as module_label','ma.action','ma.label');
  const grants = await db('auth_roles_permissions_mapping').select('role_id','module_action_id');
  const grantSet = new Set(grants.map(g => `${g.role_id}:${g.module_action_id}`));
  const matrix = roles.map(role => ({
    role: role.name,
    permissions: actions.map(a => ({ module: a.code, action: a.action, granted: grantSet.has(`${role.id}:${a.id}`) })),
  }));
  return ok(res, { matrix });
};
