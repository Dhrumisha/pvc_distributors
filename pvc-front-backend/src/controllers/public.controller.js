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
      .whereNull('c.deleted_at')
      .groupBy('c.id', 'c.name')
      .select('c.id', 'c.name', db.raw('COUNT(p.id)::int as product_count'))
      .orderBy('c.name');
  } catch (e) {
    rows = await db('categories').whereNull('deleted_at').select('id', 'name').orderBy('name');
  }
  return ok(res, { categories: rows });
};

// GET /public/products  — active products (category name + price range)
exports.products = async (req, res) => {
  const { page = 1, limit = 24, search, category_id } = req.query;
  const offset = (page - 1) * limit;

  const base = db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .whereNull('p.deleted_at');
  if (search)      base.whereILike('p.name', `%${search}%`);
  if (category_id) base.where('p.category_id', category_id);

  const [{ count }] = await base.clone().count('p.id as count');
  const products = await base.clone()
    .leftJoin('product_dimensions as pd', 'pd.product_id', 'p.id')
    .groupBy('p.id', 'p.name', 'p.unit', 'p.hsn_code', 'c.name')
    .select(
      'p.id', 'p.name', 'p.unit', 'p.hsn_code',
      db.raw('c.name as category'),
      db.raw('MIN(pd.selling_price)::float as min_price'),
      db.raw('MAX(pd.selling_price)::float as max_price'),
      db.raw('COUNT(pd.id)::int as variant_count')
    )
    .orderBy('p.name')
    .limit(limit).offset(offset);

  return paginate(res, { products }, { page, limit, total: count });
};

// GET /public/products/:id  — one product with its variants
exports.product = async (req, res) => {
  const product = await db('products as p')
    .leftJoin('categories as c', 'c.id', 'p.category_id')
    .where('p.id', req.params.id).whereNull('p.deleted_at')
    .select('p.id', 'p.name', 'p.unit', 'p.hsn_code', 'p.gst_rate', db.raw('c.name as category'))
    .first();
  if (!product) return ok(res, { product: null });
  const variants = await db('product_dimensions')
    .where({ product_id: product.id })
    .select('id', 'sku', 'dimension_label', 'selling_price')
    .orderBy('sku');
  return ok(res, { product: { ...product, variants } });
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
