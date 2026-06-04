// src/middleware/auditLog.js
// ─────────────────────────────────────────────────────────────────────────────
// Automatically writes a row to audit_logs after every mutating request.
// Usage: router.post('/', auth, rbac(...), validate(...), auditLog('products'), ctrl)
// ─────────────────────────────────────────────────────────────────────────────
const db     = require('../config/db');
const logger = require('../config/logger');

const ACTION_MAP = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

const auditLog = (moduleName) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async function (body) {
    // Only log mutations that succeeded
    if (['POST','PUT','PATCH','DELETE'].includes(req.method) && res.statusCode < 400) {
      try {
        await db('audit_logs').insert({
          user_id   : req.user?.id || null,
          module    : moduleName,
          action    : ACTION_MAP[req.method] || req.method.toLowerCase(),
          table_name: moduleName,
          record_id : body?.data?.id || null,
          new_data  : JSON.stringify(body?.data ?? null),
          ip_address: req.ip || req.socket?.remoteAddress,
          user_agent: (req.headers['user-agent'] || '').slice(0, 300),
          created_at: new Date(),
        });
      } catch (err) {
        // Audit failure must never break the response
        logger.warn('Audit log insert failed:', err.message);
      }
    }
    return originalJson(body);
  };

  next();
};

module.exports = auditLog;
