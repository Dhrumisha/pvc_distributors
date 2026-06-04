// src/controllers/modules.controller.js
const db = require('../config/db');
const { ok } = require('../utils/response');
exports.list = async (_req, res) => {
  const modules = await db('auth_modules').orderBy('sort_order');
  return ok(res, { modules });
};
exports.getActions = async (req, res) => {
  const actions = await db('auth_module_actions').where({ module_id: req.params.id }).orderBy('action');
  return ok(res, { actions });
};
