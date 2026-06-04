// src/controllers/creditNotes.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

const nextCnNumber = async () => {
  const [{ count }] = await db('credit_notes').count('id as count');
  return `CN-${new Date().getFullYear()}-${String(parseInt(count)+1).padStart(4,'0')}`;
};

exports.list = async (req, res) => {
  const { page=1, limit=20, customer_id, status } = req.query;
  const offset = (page-1)*limit;
  let q = db('credit_notes as cn').leftJoin('customers as c','c.id','cn.customer_id');
  if (customer_id) q = q.where('cn.customer_id', customer_id);
  if (status)      q = q.where('cn.status', status);
  const [{ count }] = await q.clone().count('cn.id as count');
  const credit_notes = await q.clone().select('cn.*', db.raw("c.business_name as customer_name")).orderBy('cn.created_at','desc').limit(limit).offset(offset);
  return paginate(res, { credit_notes }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { invoice_id, reason, items=[], delivery_return_id } = req.body;
  const invoice = await db('invoices').where({ id: invoice_id }).first();
  if (!invoice) throw new AppError('Invoice not found.', 404);
  const total = items.reduce((s,i) => s + (i.qty * i.unit_price), 0);
  const cn_number = await nextCnNumber();
  const [cn] = await db('credit_notes').insert({ cn_number, invoice_id, customer_id: invoice.customer_id, delivery_return_id: delivery_return_id||null, reason, subtotal: total, tax_amount: 0, total_amount: total, status:'draft', ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  if (items.length) await db('credit_note_items').insert(items.map(i => ({ credit_note_id: cn.id, product_dimension_id: i.product_dimension_id, qty: i.qty, unit_price: i.unit_price, gst_rate: i.gst_rate||0, line_total: i.qty*i.unit_price, created_at: new Date() })));
  return created(res, { credit_note: cn });
};

exports.getOne = async (req, res) => {
  const cn = await db('credit_notes as cn').leftJoin('customers as c','c.id','cn.customer_id').where('cn.id', req.params.id).select('cn.*', db.raw("c.business_name as customer_name")).first();
  if (!cn) throw new AppError('Credit note not found.', 404);
  const items = await db('credit_note_items as cni').join('product_dimensions as pd','pd.id','cni.product_dimension_id').join('products as p','p.id','pd.product_id').where('cni.credit_note_id', cn.id).select('cni.*','p.name','pd.sku');
  return ok(res, { credit_note: cn, items });
};

exports.issue = async (req, res) => {
  const [cn] = await db('credit_notes').where({ id: req.params.id, status:'draft' }).update({ status:'issued', updated_at: new Date() }).returning('*');
  if (!cn) throw new AppError('Credit note not found or already issued.', 422);
  return ok(res, { credit_note: cn }, 'Credit note issued.');
};

exports.apply = async (req, res) => {
  const cn = await db('credit_notes').where({ id: req.params.id, status:'issued' }).first();
  if (!cn) throw new AppError('Credit note not issued.', 422);
  const invoice = await db('invoices').where({ id: req.body.apply_to_invoice_id }).first();
  if (!invoice) throw new AppError('Target invoice not found.', 404);
  const applyAmt = Math.min(cn.total_amount, invoice.balance_due);
  const newBal   = parseFloat(invoice.balance_due) - applyAmt;
  await db('invoices').where({ id: invoice.id }).update({ balance_due: newBal, paid_amount: db.raw(`paid_amount + ${applyAmt}`), status: newBal<=0 ? 'paid' : 'partially_paid', updated_at: new Date() });
  const [updated] = await db('credit_notes').where({ id: cn.id }).update({ status:'applied', updated_at: new Date() }).returning('*');
  return ok(res, { credit_note: updated, invoice: { ...invoice, balance_due: newBal } }, 'Credit note applied.');
};

exports.getPdf = async (req, res) => {
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="credit-note-${req.params.id}.pdf"`);
  res.send(Buffer.from(`Credit Note PDF for ID ${req.params.id}`));
};
