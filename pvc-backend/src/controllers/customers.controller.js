// src/controllers/customers.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, search, customer_type, is_on_hold } = req.query;
  const offset = (page-1)*limit;
  let q = db('customers').whereNull('deleted_at');
  if (search)        q = q.where(b => b.whereILike('business_name',`%${search}%`).orWhereILike('phone',`%${search}%`).orWhereILike('gst_number',`%${search}%`));
  if (customer_type) q = q.where('customer_type', customer_type);
  if (is_on_hold !== undefined) q = q.where('is_on_hold', is_on_hold);
  const [{ count }] = await q.clone().count('id as count');
  const customers = await q.clone().orderBy('business_name').limit(limit).offset(offset);
  return paginate(res, { customers }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const [customer] = await db('customers').insert({
    ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date()
  }).returning('*');
  return created(res, { customer });
};

exports.getOne = async (req, res) => {
  const customer = await db('customers').where({ id: req.params.id }).whereNull('deleted_at').first();
  if (!customer) throw new AppError('Customer not found.', 404);
  const addresses = await db('customer_addresses').where({ customer_id: customer.id, is_active: 1 });
  const [{ outstanding }] = await db('invoices').where({ customer_id: customer.id }).whereIn('status',['issued','partially_paid','overdue']).sum('balance_due as outstanding');
  const topProducts = await db('sales_order_items as soi')
    .join('sales_orders as so','so.id','soi.sales_order_id')
    .join('product_dimensions as pd','pd.id','soi.product_dimension_id')
    .join('products as p','p.id','pd.product_id')
    .where('so.customer_id', customer.id).whereNot('so.status','cancelled')
    .select('p.name','pd.sku').sum('soi.ordered_qty as total_qty').groupBy('p.id','p.name','pd.sku').orderBy('total_qty','desc').limit(5);
  return ok(res, { customer, addresses, outstanding: parseFloat(outstanding)||0, top_products: topProducts });
};

exports.update = async (req, res) => {
  const [customer] = await db('customers').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!customer) throw new AppError('Customer not found.', 404);
  return ok(res, { customer });
};

exports.remove = async (req, res) => {
  await db('customers').where({ id: req.params.id }).update({ deleted_at: new Date() });
  return noContent(res);
};

exports.setHold = async (req, res) => {
  const { is_on_hold, hold_reason } = req.body;
  const [customer] = await db('customers').where({ id: req.params.id }).update({ is_on_hold, hold_reason: is_on_hold ? hold_reason : null, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { customer }, is_on_hold ? 'Customer placed on hold.' : 'Customer hold released.');
};

exports.getOrders = async (req, res) => {
  const { page=1, limit=20, status, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('sales_orders').where({ customer_id: req.params.id });
  if (status)    q = q.where('status', status);
  if (from_date) q = q.where('order_date','>=', from_date);
  if (to_date)   q = q.where('order_date','<=', to_date);
  const [{ count }] = await q.clone().count('id as count');
  const orders = await q.clone().orderBy('order_date','desc').limit(limit).offset(offset);
  return paginate(res, { orders }, { page, limit, total: count });
};

exports.getLedger = async (req, res) => {
  const { page=1, limit=30, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('customer_ledger').where({ customer_id: req.params.id });
  if (from_date) q = q.where('txn_date','>=', from_date);
  if (to_date)   q = q.where('txn_date','<=', to_date);
  const [{ count }] = await q.clone().count('id as count');
  const entries = await q.clone().orderBy('txn_date','desc').limit(limit).offset(offset);
  const [first] = await db('customer_ledger').where({ customer_id: req.params.id }).orderBy('id','asc').limit(1);
  return paginate(res, { entries, balance: entries[0]?.balance || 0 }, { page, limit, total: count });
};

exports.getStatement = async (req, res) => {
  const { from_date, to_date } = req.query;
  const customer = await db('customers').where({ id: req.params.id }).first();
  let q = db('invoices').where({ customer_id: req.params.id });
  if (from_date) q = q.where('invoice_date','>=', from_date);
  if (to_date)   q = q.where('invoice_date','<=', to_date);
  const invoices = await q.orderBy('invoice_date');
  const payments = await db('customer_payments').where({ customer_id: req.params.id })
    .modify(q => { if (from_date) q.where('payment_date','>=',from_date); if (to_date) q.where('payment_date','<=',to_date); })
    .orderBy('payment_date');
  return ok(res, { customer, invoices, payments });
};

exports.getOutstanding = async (req, res) => {
  const invoices = await db('invoices').where({ customer_id: req.params.id }).whereIn('status',['issued','partially_paid','overdue']).orderBy('due_date');
  const [{ total_due }] = await db('invoices').where({ customer_id: req.params.id }).whereIn('status',['issued','partially_paid','overdue']).sum('balance_due as total_due');
  return ok(res, { total_due: parseFloat(total_due)||0, invoices });
};

exports.getProfitability = async (req, res) => {
  const { from_date, to_date } = req.query;
  const rows = await db.raw(`
    SELECT SUM(soi.ordered_qty * soi.unit_price) as revenue,
      SUM(soi.ordered_qty * pd.purchase_price) as cost,
      SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price) as gross_profit,
      ROUND(((SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price)) / NULLIF(SUM(soi.ordered_qty * soi.unit_price),0))*100,2) as margin_pct
    FROM sales_orders so
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    JOIN product_dimensions pd ON pd.id = soi.product_dimension_id
    WHERE so.customer_id = ? AND so.status NOT IN ('draft','cancelled')
    ${from_date ? `AND so.order_date >= '${from_date}'` : ''}
    ${to_date   ? `AND so.order_date <= '${to_date}'`   : ''}
  `, [req.params.id]);
  return ok(res, rows.rows[0] || { revenue:0, cost:0, gross_profit:0, margin_pct:0 });
};

exports.getCreditStatus = async (req, res) => {
  const customer = await db('customers').where({ id: req.params.id }).first();
  if (!customer) throw new AppError('Customer not found.', 404);
  const [{ outstanding }] = await db('invoices').where({ customer_id: customer.id }).whereIn('status',['issued','partially_paid','overdue']).sum('balance_due as outstanding');
  const used = parseFloat(outstanding)||0;
  return ok(res, { credit_limit: customer.credit_limit, used, available: Math.max(0, customer.credit_limit - used), is_on_hold: !!customer.is_on_hold });
};

// Addresses
exports.getAddresses = async (req, res) => {
  const addresses = await db('customer_addresses').where({ customer_id: req.params.id, is_active: 1 }).orderBy('is_default','desc');
  return ok(res, { addresses });
};
exports.addAddress = async (req, res) => {
  if (req.body.is_default) await db('customer_addresses').where({ customer_id: req.params.id }).update({ is_default: 0 });
  const [addr] = await db('customer_addresses').insert({ ...req.body, customer_id: req.params.id, ip_address: req.ip, created_by: req.user.id, created_at: new Date() }).returning('*');
  return created(res, { address: addr });
};
exports.updateAddress = async (req, res) => {
  const [addr] = await db('customer_addresses').where({ id: req.params.aid, customer_id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!addr) throw new AppError('Address not found.', 404);
  return ok(res, { address: addr });
};
exports.setDefaultAddress = async (req, res) => {
  await db('customer_addresses').where({ customer_id: req.params.id }).update({ is_default: 0 });
  const [addr] = await db('customer_addresses').where({ id: req.params.aid }).update({ is_default: 1 }).returning('*');
  return ok(res, { address: addr });
};
exports.removeAddress = async (req, res) => {
  await db('customer_addresses').where({ id: req.params.aid, customer_id: req.params.id }).update({ is_active: 0 });
  return noContent(res);
};
