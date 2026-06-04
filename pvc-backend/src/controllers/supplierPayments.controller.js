// src/controllers/supplierPayments.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, supplier_id, purchase_invoice_id, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('supplier_payments as sp').join('suppliers as s','s.id','sp.supplier_id').join('purchase_invoices as pi','pi.id','sp.purchase_invoice_id');
  if (supplier_id)         q = q.where('sp.supplier_id', supplier_id);
  if (purchase_invoice_id) q = q.where('sp.purchase_invoice_id', purchase_invoice_id);
  if (from_date)           q = q.where('sp.payment_date','>=', from_date);
  if (to_date)             q = q.where('sp.payment_date','<=', to_date);
  const [{ count }] = await q.clone().count('sp.id as count');
  const payments = await q.clone().select('sp.*', db.raw("s.name as supplier_name"), db.raw("pi.supplier_invoice_no")).orderBy('sp.payment_date','desc').limit(limit).offset(offset);
  return paginate(res, { payments }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { purchase_invoice_id, supplier_id, payment_date, amount, mode='neft', reference_number, notes } = req.body;
  const inv = await db('purchase_invoices').where({ id: purchase_invoice_id, supplier_id }).first();
  if (!inv) throw new AppError('Purchase invoice not found.', 404);
  if (amount > parseFloat(inv.balance_due)) throw new AppError(`Payment exceeds balance due (${inv.balance_due}).`, 422);
  const [payment] = await db('supplier_payments').insert({ purchase_invoice_id, supplier_id, payment_date, amount, mode, reference_number, notes, ip_address: req.ip, created_by: req.user.id, created_at: new Date() }).returning('*');
  const newPaid    = parseFloat(inv.paid_amount) + parseFloat(amount);
  const newBalance = parseFloat(inv.total_amount) - newPaid;
  await db('purchase_invoices').where({ id: purchase_invoice_id }).update({ paid_amount: newPaid, balance_due: Math.max(0,newBalance), status: newBalance <= 0 ? 'paid' : 'partially_paid', updated_at: new Date() });
  return created(res, { payment });
};

exports.getOne = async (req, res) => {
  const payment = await db('supplier_payments as sp').join('suppliers as s','s.id','sp.supplier_id').join('purchase_invoices as pi','pi.id','sp.purchase_invoice_id').where('sp.id', req.params.id).select('sp.*', db.raw("s.name as supplier_name"), db.raw("pi.supplier_invoice_no")).first();
  if (!payment) throw new AppError('Payment not found.', 404);
  return ok(res, { payment });
};

exports.outstanding = async (req, res) => {
  const { supplier_id } = req.query;
  let q = db('suppliers as s').leftJoin(db('purchase_invoices').whereIn('status',['unpaid','partially_paid']).select('supplier_id').sum('balance_due as total').groupBy('supplier_id').as('pi'), 'pi.supplier_id','s.id').whereNotNull('pi.total');
  if (supplier_id) q = q.where('s.id', supplier_id);
  const suppliers = await q.select('s.id','s.name','s.phone', db.raw('COALESCE(pi.total,0) as outstanding')).orderBy('outstanding','desc');
  return ok(res, { suppliers });
};
