// src/controllers/portal.controller.js — CUSTOMER portal (website) endpoints.
'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');

const ROUNDS = () => parseInt(process.env.BCRYPT_ROUNDS || '12');
const signCustomer = (c) => jwt.sign(
  { cid: c.id, kind: 'customer', name: c.business_name, email: c.email },
  process.env.JWT_SECRET, { expiresIn: '7d' }
);

// ── discount / credit resolution ────────────────────────────────────────────
async function typeMap() {
  const rows = await db('customer_type_discounts');
  const m = {};
  rows.forEach(r => { m[r.customer_type] = r; });
  return m;
}
function effectiveDiscount(customer, tmap) {
  const t = tmap[customer.customer_type] || { discount_percent: 0, credit_allowed: false };
  const pct = customer.discount_percent != null ? Number(customer.discount_percent) : Number(t.discount_percent || 0);
  return {
    percent: pct,
    creditAllowed: !!t.credit_allowed && customer.portal_status === 'approved',
    typeLabel: t.label || customer.customer_type,
  };
}
async function outstandingFor(customerId) {
  const [{ outstanding }] = await db('invoices')
    .where({ customer_id: customerId }).whereIn('status', ['issued', 'partially_paid', 'overdue'])
    .sum('balance_due as outstanding');
  return parseFloat(outstanding) || 0;
}
function profile(c, eff, outstanding) {
  return {
    id: c.id, business_name: c.business_name, contact_person: c.contact_person,
    email: c.email, phone: c.phone, customer_type: c.customer_type,
    type_label: eff.typeLabel, discount_percent: eff.percent,
    credit_allowed: eff.creditAllowed, credit_limit: Number(c.credit_limit || 0),
    credit_days: c.credit_days, portal_status: c.portal_status,
    outstanding, credit_available: Math.max(0, Number(c.credit_limit || 0) - outstanding),
    is_on_hold: c.is_on_hold,
  };
}

// POST /portal/register
exports.register = async (req, res) => {
  const { business_name, contact_person, email, phone, password } = req.body || {};
  if (!business_name || !email || !password) throw new AppError('Business name, email and password are required.', 400);
  if (String(password).length < 6) throw new AppError('Password must be at least 6 characters.', 400);
  const existing = await db('customers').where({ email }).whereNull('deleted_at').first();
  if (existing && existing.password_hash) throw new AppError('An account with this email already exists. Please sign in.', 409);

  const hash = await bcrypt.hash(password, ROUNDS());
  let customer;
  if (existing) {
    // Admin had already added this customer — attach portal login (still needs approval to unlock credit)
    [customer] = await db('customers').where({ id: existing.id })
      .update({ password_hash: hash, contact_person: contact_person || existing.contact_person, phone: phone || existing.phone,
                portal_status: existing.portal_status === 'approved' ? 'approved' : 'pending', updated_at: new Date() })
      .returning('*');
  } else {
    [customer] = await db('customers').insert({
      business_name, contact_person: contact_person || null, email, phone: phone || null,
      customer_type: 'retail', credit_limit: 0, password_hash: hash, portal_status: 'pending',
      ip_address: req.ip, created_at: new Date(), updated_at: new Date(),
    }).returning('*');
  }
  // notify admins of a new portal registration
  try {
    const adminIds = await db('auth_user_roles as ur').join('auth_roles as r', 'r.id', 'ur.role_id').where('r.name', 'Admin').pluck('ur.user_id');
    if (adminIds.length) await db('notifications').insert(adminIds.map(uid => ({
      user_id: uid, type: 'customer_signup', title: `New customer registration: ${business_name}`,
      message: `${business_name} (${email}) registered on the website and is awaiting approval.`,
      ref_type: 'customers', ref_id: customer.id, channel: 'in_app', is_read: 0, created_at: new Date(),
    })));
  } catch (e) { logger.warn('signup notify failed: ' + e.message); }

  const tmap = await typeMap();
  const eff = effectiveDiscount(customer, tmap);
  const token = signCustomer(customer);
  logger.info(`[Portal] Registration: ${email}`);
  return created(res, { token, customer: profile(customer, eff, 0) },
    'Account created! You can browse and your trade pricing/credit unlocks once we approve your account.');
};

// POST /portal/login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  const customer = await db('customers').where({ email }).whereNull('deleted_at').first();
  if (!customer || !customer.password_hash || !(await bcrypt.compare(password, customer.password_hash)))
    throw new AppError('Invalid email or password.', 401);
  await db('customers').where({ id: customer.id }).update({ portal_last_login_at: new Date() });
  const tmap = await typeMap();
  const eff = effectiveDiscount(customer, tmap);
  const outstanding = await outstandingFor(customer.id);
  return ok(res, { token: signCustomer(customer), customer: profile(customer, eff, outstanding) });
};

// GET /portal/me
exports.me = async (req, res) => {
  const tmap = await typeMap();
  const eff = effectiveDiscount(req.customer, tmap);
  const outstanding = await outstandingFor(req.customer.id);
  return ok(res, { customer: profile(req.customer, eff, outstanding) });
};

// GET /portal/products — catalog priced for THIS customer
exports.products = async (req, res) => {
  const { search, category_id } = req.query;
  const tmap = await typeMap();
  const eff = effectiveDiscount(req.customer, tmap);
  let q = db('products as p').leftJoin('categories as c', 'c.id', 'p.category_id').whereNull('p.deleted_at');
  if (search) q = q.whereILike('p.name', `%${search}%`);
  if (category_id) q = q.where('p.category_id', category_id);
  const products = await q
    .leftJoin('product_dimensions as pd', 'pd.product_id', 'p.id')
    .groupBy('p.id', 'p.name', 'p.unit', 'c.name')
    .select('p.id', 'p.name', 'p.unit', db.raw('c.name as category'),
            db.raw('MIN(pd.selling_price)::float as base_min'), db.raw('MAX(pd.selling_price)::float as base_max'))
    .orderBy('p.name');
  const factor = 1 - eff.percent / 100;
  const out = products.map(p => ({
    ...p,
    discount_percent: eff.percent,
    net_min: p.base_min != null ? Math.round(p.base_min * factor * 100) / 100 : null,
    net_max: p.base_max != null ? Math.round(p.base_max * factor * 100) / 100 : null,
  }));
  return ok(res, { products: out, discount_percent: eff.percent });
};

// GET /portal/products/:id — one product with per-customer variant prices
exports.product = async (req, res) => {
  const tmap = await typeMap();
  const eff = effectiveDiscount(req.customer, tmap);
  const product = await db('products as p').leftJoin('categories as c', 'c.id', 'p.category_id')
    .where('p.id', req.params.id).whereNull('p.deleted_at')
    .select('p.id', 'p.name', 'p.unit', 'p.gst_rate', db.raw('c.name as category')).first();
  if (!product) return ok(res, { product: null });
  const factor = 1 - eff.percent / 100;
  const variants = (await db('product_dimensions').where({ product_id: product.id }).select('id', 'sku', 'dimension_label', 'selling_price').orderBy('sku'))
    .map(v => ({ ...v, base_price: Number(v.selling_price || 0), net_price: Math.round(Number(v.selling_price || 0) * factor * 100) / 100 }));
  return ok(res, { product: { ...product, discount_percent: eff.percent, variants } });
};

// POST /portal/orders — place an order (credit / Udhaar by default)
exports.placeOrder = async (req, res) => {
  const c = req.customer;
  const { items, payment_mode = 'credit', notes, delivery_type = 'our_vehicle' } = req.body || {};
  if (!Array.isArray(items) || !items.length) throw new AppError('Your cart is empty.', 400);
  if (c.is_on_hold) throw new AppError('Your account is on hold. Please contact us.', 422);

  const tmap = await typeMap();
  const eff = effectiveDiscount(c, tmap);
  const dimIds = items.map(i => i.product_dimension_id);
  const dims = await db('product_dimensions as pd').join('products as p', 'p.id', 'pd.product_id')
    .whereIn('pd.id', dimIds).select('pd.id', 'pd.selling_price', 'p.gst_rate');
  const dmap = Object.fromEntries(dims.map(d => [d.id, d]));

  const rows = [];
  let subtotal = 0, tax = 0;
  for (const it of items) {
    const d = dmap[it.product_dimension_id];
    if (!d) continue;
    const qty = Math.max(1, Number(it.qty) || 1);
    const unit = Number(d.selling_price || 0);
    const gst = Number(d.gst_rate || 0);
    const lineNet = qty * unit * (1 - eff.percent / 100);
    subtotal += lineNet;
    tax += lineNet * gst / 100;
    rows.push({ product_dimension_id: d.id, ordered_qty: qty, dispatched_qty: 0, unit_price: unit, gst_rate: gst, discount_pct: eff.percent, line_total: Math.round(lineNet * 100) / 100 });
  }
  if (!rows.length) throw new AppError('No valid items in cart.', 400);
  const total = Math.round((subtotal + tax) * 100) / 100;

  // Credit (Udhaar) check
  if (payment_mode === 'credit') {
    if (!eff.creditAllowed) throw new AppError('Credit (Udhaar) is not enabled on your account yet. Please contact us or choose Pay Now.', 422);
    const outstanding = await outstandingFor(c.id);
    const limit = Number(c.credit_limit || 0);
    if (limit > 0 && outstanding + total > limit)
      throw new AppError(`This order exceeds your available credit (limit ₹${limit}, outstanding ₹${outstanding}).`, 422);
  }

  const year = new Date().getFullYear();
  const [{ count }] = await db('sales_orders').count('id as count');
  const order_number = `SO-${year}-${String(parseInt(count) + 1).padStart(4, '0')}`;
  // sales_orders.created_by may be NOT NULL in some installs — attribute web orders to a system user.
  const sysUser = await db('auth_users').whereNull('deleted_at').orderBy('id').first();
  const [order] = await db('sales_orders').insert({
    order_number, customer_id: c.id, delivery_type, status: 'confirmed',
    order_date: new Date().toISOString().split('T')[0],
    subtotal: Math.round(subtotal * 100) / 100, tax_amount: Math.round(tax * 100) / 100, total_amount: total,
    notes: `[Website order · ${payment_mode === 'credit' ? 'CREDIT/Udhaar' : 'Pay Now'}]${notes ? ' ' + notes : ''}`,
    created_by: sysUser ? sysUser.id : null,
    ip_address: req.ip, created_at: new Date(), updated_at: new Date(),
  }).returning('*');
  await db('sales_order_items').insert(rows.map(r => ({ ...r, sales_order_id: order.id, created_at: new Date() })));

  try {
    const adminIds = await db('auth_user_roles as ur').join('auth_roles as r', 'r.id', 'ur.role_id').where('r.name', 'Admin').pluck('ur.user_id');
    if (adminIds.length) await db('notifications').insert(adminIds.map(uid => ({
      user_id: uid, type: 'web_order', title: `New website order ${order.order_number}`,
      message: `${c.business_name} placed a ${payment_mode === 'credit' ? 'credit (Udhaar)' : 'pay-now'} order of ₹${total}.`,
      ref_type: 'sales_orders', ref_id: order.id, channel: 'in_app', is_read: 0, created_at: new Date(),
    })));
  } catch (e) { logger.warn('order notify failed: ' + e.message); }

  logger.info(`[Portal] Order ${order.order_number} by customer ${c.id} (${payment_mode})`);
  return created(res, { order: { id: order.id, order_number: order.order_number, total_amount: total, payment_mode } },
    'Order placed! Our team will confirm and arrange delivery.');
};

// GET /portal/orders
exports.orders = async (req, res) => {
  const orders = await db('sales_orders').where({ customer_id: req.customer.id })
    .select('id', 'order_number', 'status', 'order_date', 'total_amount', 'notes').orderBy('created_at', 'desc').limit(100);
  return ok(res, { orders });
};

// GET /portal/orders/:id
exports.order = async (req, res) => {
  const order = await db('sales_orders').where({ id: req.params.id, customer_id: req.customer.id }).first();
  if (!order) throw new AppError('Order not found.', 404);
  const items = await db('sales_order_items as soi').join('product_dimensions as pd', 'pd.id', 'soi.product_dimension_id')
    .join('products as p', 'p.id', 'pd.product_id').where('soi.sales_order_id', order.id)
    .select('soi.ordered_qty', 'soi.unit_price', 'soi.discount_pct', 'soi.line_total', 'p.name', 'pd.sku', 'pd.dimension_label');
  return ok(res, { order, items });
};

// GET /portal/outstanding — invoices + balance
exports.outstanding = async (req, res) => {
  const invoices = await db('invoices').where({ customer_id: req.customer.id })
    .select('id', 'invoice_number', 'invoice_date', 'due_date', 'total_amount', 'paid_amount', 'balance_due', 'status')
    .orderBy('invoice_date', 'desc').limit(100);
  const outstanding = await outstandingFor(req.customer.id);
  return ok(res, { invoices, outstanding });
};

// POST /portal/payments — online payment (stub until a gateway is connected)
exports.pay = async (req, res) => {
  const { amount, invoice_id } = req.body || {};
  try {
    const adminIds = await db('auth_user_roles as ur').join('auth_roles as r', 'r.id', 'ur.role_id').where('r.name', 'Admin').pluck('ur.user_id');
    if (adminIds.length) await db('notifications').insert(adminIds.map(uid => ({
      user_id: uid, type: 'payment_intent', title: `Payment request from ${req.customer.business_name}`,
      message: `Wants to pay ₹${amount || '?'}${invoice_id ? ' for invoice #' + invoice_id : ''}. Online gateway not yet enabled — follow up.`,
      ref_type: 'customers', ref_id: req.customer.id, channel: 'in_app', is_read: 0, created_at: new Date(),
    })));
  } catch (e) { logger.warn('payment intent notify failed: ' + e.message); }
  return ok(res, null, 'Online payments are being set up. We have notified our team — they will share payment details and confirm shortly.');
};
