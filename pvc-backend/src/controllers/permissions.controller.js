// src/controllers/permissions.controller.js
const db = require('../config/db');
const { ok } = require('../utils/response');
exports.list = async (req, res) => {
  let q = db('auth_permissions');
  if (req.query.module_id) q = q.where('module_id', req.query.module_id);
  const permissions = await q.orderBy('id');
  return ok(res, { permissions });
};
