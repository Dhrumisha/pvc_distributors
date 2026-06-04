// src/controllers/suppliers.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, search, is_active } = req.query;
  const offset = (page-1)*limit;
  let q = db('suppliers').whereNull('deleted_at');
  if (search)    q = q.where(b => b.whereILike('name',`%${search}%`).orWhereILike('phone',`%${search}%`).orWhereILike('gst_number',`%${search}%`));
  if (is_active !== undefined) q = q.where('is_active', is_active);
  const [{ count }] = await q.clone().count('id as count');
  const suppliers = await q.clone().orderBy('name').limit(limit).offset(offset);
  return paginate(res, { suppliers }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const [supplier] = await db('suppliers').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { supplier });
};

exports.getOne = async (req, res) => {
  const supplier = await db('suppliers').where({ id: req.params.id }).whereNull('deleted_at').first();
  if (!supplier) throw new AppError('Supplier not found.', 404);
  const [pos] = await db('purchase_orders').where({ supplier_id: supplier.id }).count('id as count');
  const [spend] = await db('purchase_invoices').where({ supplier_id: supplier.id }).sum('total_amount as total');
  return ok(res, { supplier, stats: { total_orders: parseInt(pos.count), total_spend: parseFloat(spend.total)||0 } });
};

exports.update = async (req, res) => {
  const [supplier] = await db('suppliers').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!supplier) throw new AppError('Supplier not found.', 404);
  return ok(res, { supplier });
};

exports.remove = async (req, res) => {
  await db('suppliers').where({ id: req.params.id }).update({ deleted_at: new Date() });
  return noContent(res);
};

exports.getProducts = async (req, res) => {
  const products = await db('supplier_products as sp').join('product_dimensions as pd','pd.id','sp.product_dimension_id').join('products as p','p.id','pd.product_id').where('sp.supplier_id', req.params.id).select('sp.*','p.name','pd.sku','pd.dimension_label','pd.selling_price');
  return ok(res, { products });
};

exports.addProduct = async (req, res) => {
  const [sp] = await db('supplier_products').insert({ ...req.body, supplier_id: req.params.id, ip_address: req.ip, created_by: req.user.id, created_at: new Date() }).onConflict(['supplier_id','product_dimension_id']).merge().returning('*');
  return created(res, { supplier_product: sp });
};

exports.removeProduct = async (req, res) => {
  await db('supplier_products').where({ supplier_id: req.params.id, product_dimension_id: req.params.pdid }).delete();
  return noContent(res);
};

exports.priceHistory = async (req, res) => {
  const { product_dimension_id, from_date, to_date } = req.query;
  let q = db('supplier_price_history as sph').join('product_dimensions as pd','pd.id','sph.product_dimension_id').join('products as p','p.id','pd.product_id').where('sph.supplier_id', req.params.id);
  if (product_dimension_id) q = q.where('sph.product_dimension_id', product_dimension_id);
  if (from_date) q = q.where('sph.effective_date','>=', from_date);
  if (to_date)   q = q.where('sph.effective_date','<=', to_date);
  const history = await q.select('sph.*','p.name','pd.sku').orderBy('sph.effective_date','desc');
  return ok(res, { history });
};

exports.addPrice = async (req, res) => {
  const [entry] = await db('supplier_price_history').insert({ ...req.body, supplier_id: req.params.id, recorded_by: req.user.id, created_at: new Date() }).returning('*');
  // Also update last_purchase_price on supplier_products
  await db('supplier_products').where({ supplier_id: req.params.id, product_dimension_id: req.body.product_dimension_id }).update({ last_purchase_price: req.body.price });
  return created(res, { entry });
};

exports.getPurchaseOrders = async (req, res) => {
  const { status, from_date, to_date } = req.query;
  let q = db('purchase_orders').where({ supplier_id: req.params.id });
  if (status)    q = q.where('status', status);
  if (from_date) q = q.where('order_date','>=', from_date);
  if (to_date)   q = q.where('order_date','<=', to_date);
  const orders = await q.orderBy('order_date','desc');
  return ok(res, { orders });
};

exports.outstanding = async (req, res) => {
  const invoices = await db('purchase_invoices').where({ supplier_id: req.params.id }).whereIn('status',['unpaid','partially_paid']);
  const [{ balance }] = await db('purchase_invoices').where({ supplier_id: req.params.id }).whereIn('status',['unpaid','partially_paid']).sum('balance_due as balance');
  return ok(res, { balance: parseFloat(balance)||0, invoices });
};
