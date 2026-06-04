// src/controllers/auditLogs.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=30, user_id, module, action, table_name, record_id, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('audit_logs as al').leftJoin('auth_users as u','u.id','al.user_id');
  if (user_id)    q = q.where('al.user_id', user_id);
  if (module)     q = q.where('al.module', module);
  if (action)     q = q.where('al.action', action);
  if (table_name) q = q.where('al.table_name', table_name);
  if (record_id)  q = q.where('al.record_id', record_id);
  if (from_date)  q = q.where('al.created_at','>=', from_date);
  if (to_date)    q = q.where('al.created_at','<=', to_date);
  const [{ count }] = await q.clone().count('al.id as count');
  const logs = await q.clone().select('al.*', db.raw("u.name as user_name"), db.raw("u.email as user_email")).orderBy('al.created_at','desc').limit(limit).offset(offset);
  return paginate(res, { logs }, { page, limit, total: count });
};

exports.getOne = async (req, res) => {
  const log = await db('audit_logs as al').leftJoin('auth_users as u','u.id','al.user_id').where('al.id', req.params.id).select('al.*', db.raw("u.name as user_name")).first();
  if (!log) throw new AppError('Log not found.', 404);
  return ok(res, { log });
};

exports.export = async (req, res) => {
  const { from_date, to_date, module } = req.query;
  let q = db('audit_logs as al').leftJoin('auth_users as u','u.id','al.user_id');
  if (from_date) q = q.where('al.created_at','>=', from_date);
  if (to_date)   q = q.where('al.created_at','<=', to_date);
  if (module)    q = q.where('al.module', module);
  const rows = await q.select('al.created_at','u.name as user','u.email','al.module','al.action','al.table_name','al.record_id','al.ip_address').orderBy('al.created_at','desc').limit(5000);
  const headers = Object.keys(rows[0]||{}).join(',');
  const lines = rows.map(r => Object.values(r).map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(','));
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="audit-logs.csv"');
  res.send([headers,...lines].join('\n'));
};
