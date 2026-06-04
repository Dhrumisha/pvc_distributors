// src/services/permissions.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Loads a user's roles + flat permission list.
// Caches in Redis for TTL seconds to avoid hitting the DB on every request.
// Falls back to DB if Redis is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
const db     = require('../config/db');
const { getRedis } = require('../config/redis');

const TTL = parseInt(process.env.REDIS_PERMISSION_CACHE_TTL || '300');

/**
 * Returns { roles: string[], permissions: string[] } for a user.
 * permissions are in the format "module.action" e.g. "inventory.view".
 */
async function getPermissionsForUser(userId) {
  const cacheKey = `permissions:${userId}`;

  // Try cache first
  try {
    const redis  = await getRedis();
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
  } catch { /* Redis miss — fall through to DB */ }

  // DB query: user → user_roles → roles → role_permissions → module_actions → modules
  const rows = await db('auth_user_roles as ur')
    .join('auth_roles as r',               'r.id',  'ur.role_id')
    .leftJoin('auth_roles_permissions_mapping as rpm', 'rpm.role_id', 'r.id')
    .leftJoin('auth_module_actions as ma',  'ma.id', 'rpm.module_action_id')
    .leftJoin('auth_modules as m',          'm.id',  'ma.module_id')
    .where('ur.user_id', userId)
    .whereNull('ur.expires_at', function() {
      this.orWhere('ur.expires_at', '>', new Date());
    })
    .select('r.name as role_name', 'm.code as module_code', 'ma.action');

  const roles       = [...new Set(rows.map(r => r.role_name).filter(Boolean))];
  const permissions = [...new Set(
    rows
      .filter(r => r.module_code && r.action)
      .map(r => `${r.module_code}.${r.action}`)
  )];

  const result = { roles, permissions };

  // Write to cache
  try {
    const redis = await getRedis();
    if (redis) await redis.setEx(cacheKey, TTL, JSON.stringify(result));
  } catch { /* ignore */ }

  return result;
}

/**
 * Invalidate cache for a user (call when roles change).
 */
async function invalidatePermissionCache(userId) {
  try {
    const redis = await getRedis();
    if (redis) await redis.del(`permissions:${userId}`);
  } catch { /* ignore */ }
}

module.exports = { getPermissionsForUser, invalidatePermissionCache };
