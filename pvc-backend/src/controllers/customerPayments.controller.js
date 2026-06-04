// src/controllers/customerPayments.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, customer_id, invoice_id, mode, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('customer_payments as cp').join('customers as c','c.id','cp.customer_id').join('invoices as i','i.id','cp.invoice_id');
  if (customer_id) q = q.where('cp.customer_id', customer_id);
  if (invoice_id)  q = q.where('cp.invoice_id', invoice_id);
  if (mode)        q = q.where('cp.mode', mode);
  if (from_date)   q = q.where('cp.payment_date','>=', from_date);
  if (to_date)     q = q.where('cp.payment_date','<=', to_date);
  const [{ count }] = await q.clone().count('cp.id as count');
  const payments = await q.clone().select('cp.*', db.raw("c.business_name as customer_name"), db.raw("i.invoice_number")).orderBy('cp.payment_date','desc').limit(limit).offset(offset);
  return paginate(res, { payments }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { invoice_id, customer_id, payment_date, amount, mode, reference_number, cheque_number, cheque_bank, cheque_date, tds_amount=0, notes } = req.body;
  const invoice = await db('invoices').where({ id: invoice_id, customer_id }).first();
  if (!invoice) throw new AppError('Invoice not found.', 404);
  if (amount > parseFloat(invoice.balance_due)) throw new AppError(`Payment (${amount}) exceeds balance due (${invoice.balance_due}).`, 422);
  const [payment] = await db('customer_payments').insert({ invoice_id, customer_id, payment_date, amount, mode, reference_number, cheque_number, cheque_bank, cheque_date: cheque_date||null, tds_amount, notes, ip_address: req.ip, created_by: req.user.id, created_at: new Date() }).returning('*');
  // Update invoice
  const newPaid    = parseFloat(invoice.paid_amount) + parseFloat(amount);
  const newBalance = parseFloat(invoice.total_amount) - newPaid;
  const newStatus  = newBalance <= 0 ? 'paid' : 'partially_paid';
  await db('invoices').where({ id: invoice_id }).update({ paid_amount: newPaid, balance_due: Math.max(0, newBalance), status: newStatus, updated_at: new Date() });
  // Credit customer ledger
  const [last] = await db('customer_ledger').where({ customer_id }).orderBy('id','desc').limit(1);
  const prevBal = last ? parseFloat(last.balance) : 0;
  await db('customer_ledger').insert({ customer_id, txn_date: payment_date, txn_type:'payment', ref_type:'customer_payments', ref_id: payment.id, debit:0, credit: amount, balance: prevBal - amount, description:`Payment via ${mode} for ${invoice.invoice_number}`, created_at: new Date() });
  return created(res, { payment, invoice: { ...invoice, paid_amount: newPaid, balance_due: Math.max(0,newBalance), status: newStatus } });
};

exports.getOne = async (req, res) => {
  const payment = await db('customer_payments as cp').join('customers as c','c.id','cp.customer_id').join('invoices as i','i.id','cp.invoice_id').where('cp.id', req.params.id).select('cp.*', db.raw("c.business_name as customer_name"), db.raw("i.invoice_number")).first();
  if (!payment) throw new AppError('Payment not found.', 404);
  return ok(res, { payment });
};

exports.chequesDue = async (req, res) => {
  const days = parseInt(req.query.days||7);
  const future = new Date(Date.now() + days*24*60*60*1000);
  const cheques = await db('customer_payments as cp').join('customers as c','c.id','cp.customer_id').join('invoices as i','i.id','cp.invoice_id').where('cp.mode','cheque').where('cp.cheque_date','<=', future).where('cp.cheque_date','>=', new Date()).select('cp.*', db.raw("c.business_name"), db.raw("i.invoice_number")).orderBy('cp.cheque_date','asc');
  return ok(res, { cheques });
};

exports.aging = async (req, res) => {
  const { customer_id } = req.query;
  const rows = (await db.raw(`
    SELECT c.business_name as customer,
      SUM(CASE WHEN EXTRACT(DAY FROM NOW()-i.due_date) BETWEEN 0 AND 30 THEN i.balance_due ELSE 0 END) as "0_30",
      SUM(CASE WHEN EXTRACT(DAY FROM NOW()-i.due_date) BETWEEN 31 AND 60 THEN i.balance_due ELSE 0 END) as "31_60",
      SUM(CASE WHEN EXTRACT(DAY FROM NOW()-i.due_date) BETWEEN 61 AND 90 THEN i.balance_due ELSE 0 END) as "61_90",
      SUM(CASE WHEN EXTRACT(DAY FROM NOW()-i.due_date) > 90 THEN i.balance_due ELSE 0 END) as "over_90",
      SUM(i.balance_due) as total_due
    FROM invoices i JOIN customers c ON c.id = i.customer_id
    WHERE i.status IN ('issued','partially_paid','overdue')
    ${customer_id ? `AND i.customer_id = ${customer_id}` : ''}
    GROUP BY c.id, c.business_name HAVING SUM(i.balance_due) > 0 ORDER BY total_due DESC
  `)).rows;
  return ok(res, { aging: rows });
};

exports.logReminder = async (req, res) => {
  const { channel, notes } = req.body;
  await db('customer_payments').where({ id: req.params.id }).update({ reminder_sent_at: new Date(), reminder_channel: channel });
  return ok(res, null, `Reminder logged via ${channel}.`);
};
