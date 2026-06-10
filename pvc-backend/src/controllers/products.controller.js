// src/controllers/products.controller.js
const db       = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, search, category_id, is_active } = req.query;
  const offset = (page-1)*limit;
  let q = db('products as p')
    .leftJoin('categories as c','c.id','p.category_id')
    .leftJoin('suppliers as s','s.id','p.default_supplier_id')
    .whereNull('p.deleted_at');
  if (search)      q = q.whereILike('p.name', `%${search}%`);
  if (category_id) q = q.where('p.category_id', category_id);
  if (is_active !== undefined) q = q.where('p.is_active', is_active);
  const [{ count }] = await q.clone().count('p.id as count');
  const products = await q.clone()
    .select('p.id','p.name','p.unit','p.hsn_code','p.gst_rate','p.low_stock_threshold','p.is_active',
      db.raw("json_build_object('id', c.id, 'name', c.name) as category"),
      db.raw("json_build_object('id', s.id, 'name', s.name) as default_supplier"))
    .orderBy('p.name').limit(limit).offset(offset);
  return paginate(res, { products }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { name, category_id, unit, hsn_code, gst_rate=0, low_stock_threshold=10, description, default_supplier_id, image_url, badge } = req.body;
  const [product] = await db('products').insert({
    name, category_id, unit, hsn_code, gst_rate, low_stock_threshold, description,
    default_supplier_id: default_supplier_id || null,
    image_url: image_url || null, badge: badge || null,
    is_active: 1, status:'ACTIVE', ip_address: req.ip,
    created_by: req.user.id, created_at: new Date(), updated_at: new Date()
  }).returning('*');
  return created(res, { product });
};

exports.getOne = async (req, res) => {
  const product = await db('products as p')
    .leftJoin('categories as c','c.id','p.category_id')
    .where('p.id', req.params.id).whereNull('p.deleted_at')
    .select('p.*', db.raw("json_build_object('id',c.id,'name',c.name) as category"))
    .first();
  if (!product) throw new AppError('Product not found.', 404);
  // Current stock per SKU
  const stockRaw = await db('stock_ledger')
    .select('product_dimension_id')
    .sum('qty_change as current_qty')
    .groupBy('product_dimension_id');
  const stockMap = Object.fromEntries(stockRaw.map(s => [s.product_dimension_id, parseFloat(s.current_qty)]));
  const dimensions = await db('product_dimensions').where({ product_id: product.id }).orderBy('sku');
  const dimsWithStock = dimensions.map(d => ({ ...d, current_qty: stockMap[d.id] || 0 }));
  return ok(res, { product, dimensions: dimsWithStock });
};

exports.update = async (req, res) => {
  const [product] = await db('products').where({ id: req.params.id })
    .update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!product) throw new AppError('Product not found.', 404);
  return ok(res, { product });
};

exports.remove = async (req, res) => {
  await db('products').where({ id: req.params.id }).update({ deleted_at: new Date() });
  return noContent(res);
};

exports.getDimensions = async (req, res) => {
  const dims = await db('product_dimensions').where({ product_id: req.params.id }).orderBy('sku');
  const stockRaw = await db('stock_ledger').whereIn('product_dimension_id', dims.map(d=>d.id)).select('product_dimension_id').sum('qty_change as current_qty').groupBy('product_dimension_id');
  const stockMap = Object.fromEntries(stockRaw.map(s => [s.product_dimension_id, parseFloat(s.current_qty)]));
  return ok(res, { dimensions: dims.map(d => ({ ...d, current_qty: stockMap[d.id]||0 })) });
};

exports.addDimension = async (req, res) => {
  const { sku, dimension_label, purchase_price, selling_price, width_mm, height_mm, thickness_mm, color } = req.body;
  const exists = await db('product_dimensions').where({ sku }).first();
  if (exists) throw new AppError(`SKU "${sku}" already exists.`, 409);
  const [dim] = await db('product_dimensions').insert({ product_id: req.params.id, sku, dimension_label, purchase_price, selling_price, width_mm, height_mm, thickness_mm, color: color || null, is_active:1, status:'ACTIVE', created_by: req.user.id, created_at: new Date() }).returning('*');
  return created(res, { dimension: dim });
};

exports.updateDimension = async (req, res) => {
  const [dim] = await db('product_dimensions').where({ id: req.params.did, product_id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!dim) throw new AppError('Dimension not found.', 404);
  return ok(res, { dimension: dim });
};

exports.removeDimension = async (req, res) => {
  await db('product_dimensions').where({ id: req.params.did, product_id: req.params.id }).update({ is_active: 0 });
  return noContent(res);
};

exports.lowStock = async (req, res) => {
  const items = await db('product_dimensions as pd')
    .join('products as p','p.id','pd.product_id')
    .leftJoin(
      db('stock_ledger').select('product_dimension_id').sum('qty_change as total').groupBy('product_dimension_id').as('sl'),
      'sl.product_dimension_id','pd.id'
    )
    .whereNull('p.deleted_at')
    .whereRaw('COALESCE(sl.total, 0) < p.low_stock_threshold')
    .select('pd.id','p.name','pd.sku','pd.dimension_label','p.low_stock_threshold', db.raw('COALESCE(sl.total, 0) as current_qty'));
  return ok(res, { items });
};

exports.deadStock = async (req, res) => {
  const days = parseInt(req.query.days || '60');
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const active = await db('stock_ledger').where('created_at', '>', cutoff).distinct('product_dimension_id').pluck('product_dimension_id');
  const items = await db('product_dimensions as pd').join('products as p','p.id','pd.product_id').whereNotIn('pd.id', active).where('pd.is_active',1).select('pd.id','p.name','pd.sku','pd.dimension_label');
  return ok(res, { items });
};
