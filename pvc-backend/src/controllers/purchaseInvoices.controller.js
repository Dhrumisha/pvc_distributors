// src/controllers/purchaseInvoices.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, supplier_id, status, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('purchase_invoices as pi').leftJoin('suppliers as s','s.id','pi.supplier_id');
  if (supplier_id) q = q.where('pi.supplier_id', supplier_id);
  if (status)      q = q.where('pi.status', status);
  if (from_date)   q = q.where('pi.invoice_date','>=', from_date);
  if (to_date)     q = q.where('pi.invoice_date','<=', to_date);
  const [{ count }] = await q.clone().count('pi.id as count');
  const invoices = await q.clone().select('pi.*', db.raw("s.name as supplier_name")).orderBy('pi.invoice_date','desc').limit(limit).offset(offset);
  return paginate(res, { invoices }, { page, limit, total: count });
};
exports.create = async (req, res) => {
  const [inv] = await db('purchase_invoices').insert({ ...req.body, paid_amount:0, balance_due: req.body.total_amount, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { invoice: inv });
};
exports.getOne = async (req, res) => {
  const inv = await db('purchase_invoices as pi').leftJoin('suppliers as s','s.id','pi.supplier_id').where('pi.id', req.params.id).select('pi.*', db.raw("s.name as supplier_name")).first();
  if (!inv) throw new AppError('Purchase invoice not found.', 404);
  return ok(res, { invoice: inv });
};
exports.update = async (req, res) => {
  const [inv] = await db('purchase_invoices').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { invoice: inv });
};
exports.setStatus = async (req, res) => {
  const [inv] = await db('purchase_invoices').where({ id: req.params.id }).update({ status: req.body.status, updated_at: new Date() }).returning('*');
  return ok(res, { invoice: inv });
};
