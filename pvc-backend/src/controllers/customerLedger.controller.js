// src/controllers/customerLedger.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, paginate } = require('../utils/response');

exports.get = async (req, res) => {
  const { page=1, limit=30, from_date, to_date, txn_type } = req.query;
  const offset = (page-1)*limit;
  let q = db('customer_ledger').where({ customer_id: req.params.customerId });
  if (from_date) q = q.where('txn_date','>=', from_date);
  if (to_date)   q = q.where('txn_date','<=', to_date);
  if (txn_type)  q = q.where('txn_type', txn_type);
  const [{ count }] = await q.clone().count('id as count');
  const entries = await q.clone().orderBy('txn_date','desc').orderBy('id','desc').limit(limit).offset(offset);
  return paginate(res, { entries, opening_balance: 0, closing_balance: entries[0]?.balance||0 }, { page, limit, total: count });
};

exports.summary = async (req, res) => {
  const customerId = req.params.customerId;
  const [billed]      = await db('invoices').where({ customer_id: customerId }).whereNot('status','cancelled').sum('total_amount as total');
  const [paid]        = await db('customer_payments').where({ customer_id: customerId }).sum('amount as total');
  const [outstanding] = await db('invoices').where({ customer_id: customerId }).whereIn('status',['issued','partially_paid','overdue']).sum('balance_due as total');
  const [overdue]     = await db('invoices').where({ customer_id: customerId, status:'overdue' }).sum('balance_due as total');
  return ok(res, { billed: parseFloat(billed.total)||0, paid: parseFloat(paid.total)||0, outstanding: parseFloat(outstanding.total)||0, overdue: parseFloat(overdue.total)||0 });
};
