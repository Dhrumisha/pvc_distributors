// src/controllers/quotations.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

const nextQtNumber = async () => {
  const [{ count }] = await db('quotations').count('id as count');
  return `QT-${new Date().getFullYear()}-${String(parseInt(count)+1).padStart(4,'0')}`;
};

exports.list = async (req, res) => {
  const { page=1, limit=20, customer_id, status, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('quotations as q').leftJoin('customers as c','c.id','q.customer_id');
  if (customer_id) q = q.where('q.customer_id', customer_id);
  if (status)      q = q.where('q.status', status);
  if (from_date)   q = q.whereRaw(`q.created_at >= '${from_date}'`);
  if (to_date)     q = q.whereRaw(`q.created_at <= '${to_date}'`);
  const [{ count }] = await q.clone().count('q.id as count');
  const quotations = await q.clone().select('q.*', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer")).orderBy('q.created_at','desc').limit(limit).offset(offset);
  return paginate(res, { quotations }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { customer_id, valid_until, notes, items=[] } = req.body;
  if (!items.length) throw new AppError('At least one item required.', 400);
  const subtotal = items.reduce((s,i) => s + (i.qty * i.unit_price * (1-(i.discount_pct||0)/100)), 0);
  const tax      = items.reduce((s,i) => s + (i.qty * i.unit_price * (i.gst_rate||0)/100), 0);
  const quotation_number = await nextQtNumber();
  const [qt] = await db('quotations').insert({ quotation_number, customer_id, valid_until: valid_until||null, notes, status:'draft', subtotal, tax_amount: tax, total_amount: subtotal+tax, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('quotation_items').insert(items.map(i => ({ quotation_id: qt.id, product_dimension_id: i.product_dimension_id, qty: i.qty, locked_unit_price: i.unit_price, gst_rate: i.gst_rate||0, discount_pct: i.discount_pct||0, line_total: i.qty*i.unit_price*(1-(i.discount_pct||0)/100), created_at: new Date() })));
  return created(res, { quotation: qt });
};

exports.getOne = async (req, res) => {
  const qt = await db('quotations as q').leftJoin('customers as c','c.id','q.customer_id').where('q.id', req.params.id).select('q.*', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer")).first();
  if (!qt) throw new AppError('Quotation not found.', 404);
  const items = await db('quotation_items as qi').join('product_dimensions as pd','pd.id','qi.product_dimension_id').join('products as p','p.id','pd.product_id').where('qi.quotation_id', qt.id).select('qi.*','p.name','pd.sku');
  return ok(res, { quotation: qt, items });
};

exports.update = async (req, res) => {
  const [qt] = await db('quotations').where({ id: req.params.id, status:'draft' }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!qt) throw new AppError('Only draft quotations can be edited.', 422);
  return ok(res, { quotation: qt });
};

exports.setStatus = async (req, res) => {
  const [qt] = await db('quotations').where({ id: req.params.id }).update({ status: req.body.status, updated_at: new Date() }).returning('*');
  return ok(res, { quotation: qt });
};

exports.convert = async (req, res) => {
  const qt = await db('quotations').where({ id: req.params.id }).whereIn('status',['approved','sent']).first();
  if (!qt) throw new AppError('Quotation must be approved or sent to convert.', 422);
  const items = await db('quotation_items').where({ quotation_id: qt.id });
  // Build sales order
  const year = new Date().getFullYear();
  const [{ count }] = await db('sales_orders').count('id as count');
  const order_number = `SO-${year}-${String(parseInt(count)+1).padStart(4,'0')}`;
  const [order] = await db('sales_orders').insert({ order_number, customer_id: qt.customer_id, quotation_id: qt.id, delivery_type: req.body.delivery_type||'our_vehicle', required_date: req.body.required_date||null, notes: req.body.notes||qt.notes, status:'draft', order_date: new Date().toISOString().split('T')[0], subtotal: qt.subtotal, tax_amount: qt.tax_amount, total_amount: qt.total_amount, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('sales_order_items').insert(items.map(i => ({ sales_order_id: order.id, product_dimension_id: i.product_dimension_id, ordered_qty: i.qty, dispatched_qty:0, unit_price: i.locked_unit_price, gst_rate: i.gst_rate, discount_pct: i.discount_pct, line_total: i.line_total, created_at: new Date() })));
  await db('quotations').where({ id: qt.id }).update({ status:'converted', converted_order_id: order.id, updated_at: new Date() });
  return created(res, { sales_order: order });
};

exports.getPdf = async (req, res) => {
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="quotation-${req.params.id}.pdf"`);
  res.send(Buffer.from(`Quotation PDF for ID ${req.params.id}`));
};

exports.share = async (req, res) => {
  const { channel, recipient } = req.body;
  return ok(res, null, `Quotation shared via ${channel} to ${recipient}.`);
};
