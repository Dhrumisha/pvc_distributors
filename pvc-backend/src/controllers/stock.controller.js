// src/controllers/stock.controller.js
const db       = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

const currentStockQuery = () =>
  db('stock_ledger')
    .select('product_dimension_id')
    .sum('qty_change as current_qty')
    .groupBy('product_dimension_id')
    .as('sl');

exports.list = async (req, res) => {
  const { page=1, limit=20, search, category_id, below_threshold } = req.query;
  const offset = (page-1)*limit;
  let q = db('product_dimensions as pd')
    .join('products as p','p.id','pd.product_id')
    .leftJoin(currentStockQuery(), 'sl.product_dimension_id','pd.id')
    .whereNull('p.deleted_at').where('pd.is_active',1);
  if (search)      q = q.where(b => b.whereILike('p.name',`%${search}%`).orWhereILike('pd.sku',`%${search}%`));
  if (category_id) q = q.where('p.category_id', category_id);
  if (below_threshold) q = q.whereRaw('COALESCE(sl.current_qty,0) < p.low_stock_threshold');
  const [{ count }] = await q.clone().count('pd.id as count');
  const stock = await q.clone()
    .select('pd.id','p.name','pd.sku','pd.dimension_label','p.unit','p.low_stock_threshold',
      db.raw('COALESCE(sl.current_qty,0) as current_qty'),
      db.raw('CASE WHEN COALESCE(sl.current_qty,0) < p.low_stock_threshold THEN true ELSE false END as is_low'))
    .orderBy('p.name').limit(limit).offset(offset);
  return paginate(res, { stock }, { page, limit, total: count });
};

exports.getOne = async (req, res) => {
  const { page=1, limit=30 } = req.query;
  const offset = (page-1)*limit;
  const dim = await db('product_dimensions as pd').join('products as p','p.id','pd.product_id').where('pd.id',req.params.dimensionId).select('pd.*','p.name as product_name','p.unit','p.low_stock_threshold').first();
  if (!dim) throw new AppError('SKU not found.', 404);
  const [{ total }] = await db('stock_ledger').where({ product_dimension_id: dim.id }).sum('qty_change as total');
  const [{ count }] = await db('stock_ledger').where({ product_dimension_id: dim.id }).count('id as count');
  const ledger = await db('stock_ledger as sl')
    .leftJoin('auth_users as u','u.id','sl.created_by')
    .where('sl.product_dimension_id', dim.id)
    .select('sl.*', db.raw("u.name as created_by_name"))
    .orderBy('sl.created_at','desc').limit(limit).offset(offset);
  return paginate(res, { dimension: dim, current_qty: parseFloat(total)||0, ledger }, { page, limit, total: count });
};

exports.openingBulk = async (req, res) => {
  const { items } = req.body;
  if (!items?.length) throw new AppError('No items provided.', 400);
  const entries = [];
  for (const item of items) {
    const [{ current }] = await db('stock_ledger').where({ product_dimension_id: item.product_dimension_id }).sum('qty_change as current');
    const currentQty = parseFloat(current)||0;
    const entry = { product_dimension_id: item.product_dimension_id, batch_lot_id: item.batch_lot_id||null, qty_change: item.qty, qty_after: currentQty + item.qty, txn_type:'opening', ref_type:'manual', notes:'Opening stock entry', created_by: req.user.id, created_at: new Date() };
    const [row] = await db('stock_ledger').insert(entry).returning('*');
    entries.push(row);
  }
  return created(res, { entries });
};

exports.adjustment = async (req, res) => {
  const { product_dimension_id, qty_change, txn_type='adjustment', notes } = req.body;
  const [{ current }] = await db('stock_ledger').where({ product_dimension_id }).sum('qty_change as current');
  const newQty = (parseFloat(current)||0) + qty_change;
  if (newQty < 0) throw new AppError('Adjustment would result in negative stock.', 422);
  const [entry] = await db('stock_ledger').insert({ product_dimension_id, qty_change, qty_after: newQty, txn_type, ref_type:'manual', notes, created_by: req.user.id, created_at: new Date() }).returning('*');
  return created(res, { entry });
};

exports.damage = async (req, res) => {
  const { product_dimension_id, qty, reason, batch_lot_id } = req.body;
  const [{ current }] = await db('stock_ledger').where({ product_dimension_id }).sum('qty_change as current');
  const currentQty = parseFloat(current)||0;
  if (qty > currentQty) throw new AppError('Damage quantity exceeds current stock.', 422);
  const [entry] = await db('stock_ledger').insert({ product_dimension_id, batch_lot_id: batch_lot_id||null, qty_change: -qty, qty_after: currentQty - qty, txn_type:'damage', ref_type:'manual', notes: reason, created_by: req.user.id, created_at: new Date() }).returning('*');
  return created(res, { entry });
};

exports.reservations = async (req, res) => {
  const reservations = await db('stock_ledger')
    .where('txn_type','reservation')
    .select('product_dimension_id').sum('qty_change as reserved_qty')
    .groupBy('product_dimension_id')
    .havingRaw('SUM(qty_change) < 0');
  return ok(res, { reservations });
};
