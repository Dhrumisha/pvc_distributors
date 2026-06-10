// src/controllers/public.controller.js
// PUBLIC, no-auth endpoints consumed by the marketing website (server-side).
'use strict';
const db = require('../config/db');
const logger = require('../config/logger');
const { ok, created, paginate } = require('../utils/response');

// GET /public/categories  — active categories with product counts
exports.categories = async (_req, res) => {
  let rows;
  try {
    rows = await db('categories as c')
      .leftJoin('products as p', function () {
        this.on('p.category_id', 'c.id').andOnNull('p.deleted_at');
      })
      .groupBy('c.id', 'c.name')
      .select('c.id', 'c.name', db.raw('COUNT(p.id)::int as product_count'))
      .orderBy('c.name');
  } catch (e) {
    rows = await db('categories').select('id', 'name').orderBy('name');
  }
  return ok(res, { categories: rows });
};

// stock subquery: current qty per product_dimension
const stockSub = () => db('stock_ledger').select('product_dimension_id').sum('qty_change as qty').groupBy('product_dimension_id');

// GET /public/products  — ACTIVE, non-deleted products with price range + stock
exports.products = async (req, res) => {
  const { page = 1, limit = 24, search, category_id } = req.query;
  const offset = (page - 1) * limit;

  const base = db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .whereNull('p.deleted_at').where('p.is_active', 1);   // only published/active
  if (search)      base.whereILike('p.name', `%${search}%`);
  if (category_id) base.where('p.category_id', category_id);

  const [{ count }] = await base.clone().count('p.id as count');
  const products = await base.clone()
    .leftJoin('product_dimensions as pd', 'pd.product_id', 'p.id')
    .leftJoin(stockSub().as('sl'), 'sl.product_dimension_id', 'pd.id')
    .groupBy('p.id', 'p.name', 'p.unit', 'p.hsn_code', 'p.image_url', 'p.badge', 'c.name')
    .select(
      'p.id', 'p.name', 'p.unit', 'p.hsn_code', 'p.image_url', 'p.badge',
      db.raw('c.name as category'),
      db.raw('MIN(pd.selling_price)::float as min_price'),
      db.raw('MAX(pd.selling_price)::float as max_price'),
      db.raw('COUNT(pd.id)::int as variant_count'),
      db.raw('COALESCE(SUM(sl.qty),0)::float as stock')
    )
    .orderBy('p.name')
    .limit(limit).offset(offset);

  const out = products.map(p => ({ ...p, in_stock: Number(p.stock) > 0 }));
  return paginate(res, { products: out }, { page, limit, total: count });
};

// GET /public/products/:id  — one product with variants (color + stock)
exports.product = async (req, res) => {
  const product = await db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .where('p.id', req.params.id).whereNull('p.deleted_at').where('p.is_active', 1)
    .select('p.id', 'p.name', 'p.unit', 'p.hsn_code', 'p.gst_rate', 'p.image_url', 'p.badge', 'p.description', db.raw('c.name as category'))
    .first();
  if (!product) return ok(res, { product: null });
  const variants = (await db('product_dimensions as pd')
    .leftJoin(stockSub().as('sl'), 'sl.product_dimension_id', 'pd.id')
    .where('pd.product_id', product.id)
    .select('pd.id', 'pd.sku', 'pd.dimension_label', 'pd.color', 'pd.selling_price', db.raw('COALESCE(sl.qty,0)::float as stock'))
    .orderBy('pd.sku'))
    .map(v => ({ ...v, in_stock: Number(v.stock) > 0 }));
  return ok(res, { product: { ...product, variants, in_stock: variants.some(v => v.in_stock) } });
};

// POST /public/enquiries  — capture a lead from the website
exports.createEnquiry = async (req, res) => {
  const { name, email, phone, company, subject, message, type, product_interest } = req.body || {};
  if (!name || (!email && !phone)) {
    return res.status(400).json({ success: false, message: 'Name and at least an email or phone are required.' });
  }
  const [row] = await db('enquiries').insert({
    name: String(name).slice(0, 150),
    email: email ? String(email).slice(0, 150) : null,
    phone: phone ? String(phone).slice(0, 30) : null,
    company: company ? String(company).slice(0, 150) : null,
    subject: subject ? String(subject).slice(0, 200) : null,
    message: message ? String(message) : null,
    type: type === 'quote' ? 'quote' : 'contact',
    product_interest: product_interest ? String(product_interest).slice(0, 200) : null,
    status: 'new',
    source: 'website',
    ip_address: req.ip,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning(['id', 'name', 'type']);

  // Notify all admins in-app (best effort)
  try {
    const adminIds = await db('auth_user_roles as ur')
      .join('auth_roles as r', 'r.id', 'ur.role_id')
      .where('r.name', 'Admin').pluck('ur.user_id');
    if (adminIds.length) {
      await db('notifications').insert(adminIds.map(uid => ({
        user_id: uid, type: 'enquiry',
        title: `New ${row.type} enquiry: ${row.name}`,
        message: (subject || message || 'New website enquiry').toString().slice(0, 240),
        ref_type: 'enquiries', ref_id: row.id, channel: 'in_app', is_read: 0, created_at: new Date(),
      })));
    }
  } catch (e) { logger.warn('Enquiry admin notify failed: ' + e.message); }

  logger.info(`[Public] New ${row.type} enquiry #${row.id} from ${name}`);
  return created(res, { enquiry: { id: row.id } }, 'Thank you! Your enquiry has been received. We will get back to you soon.');
};
