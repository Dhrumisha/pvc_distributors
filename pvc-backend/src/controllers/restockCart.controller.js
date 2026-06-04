// src/controllers/restockCart.controller.js
const db = require('../config/db');
const { ok, created, noContent } = require('../utils/response');

const getOrCreateCart = async (userId) => {
  let cart = await db('restock_cart').where({ created_by: userId, status:'draft' }).first();
  if (!cart) [cart] = await db('restock_cart').insert({ name:'Restock Draft', status:'draft', created_by: userId, created_at: new Date(), updated_at: new Date() }).returning('*');
  return cart;
};

exports.get = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const items = await db('restock_cart_items as rci').join('product_dimensions as pd','pd.id','rci.product_dimension_id').join('products as p','p.id','pd.product_id').where('rci.restock_cart_id', cart.id).select('rci.*','p.name','pd.sku','pd.dimension_label','pd.purchase_price');
  return ok(res, { cart, items });
};
exports.addItem = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const [{ total }] = await db('stock_ledger').where({ product_dimension_id: req.body.product_dimension_id }).sum('qty_change as total');
  const current = parseFloat(total)||0;
  const [item] = await db('restock_cart_items').insert({ restock_cart_id: cart.id, product_dimension_id: req.body.product_dimension_id, current_stock: current, suggested_qty: req.body.override_qty||10, override_qty: req.body.override_qty||null, added_reason:'manual', created_at: new Date() }).returning('*');
  return created(res, { item });
};
exports.updateItem = async (req, res) => {
  const [item] = await db('restock_cart_items').where({ id: req.params.id }).update({ override_qty: req.body.override_qty, updated_at: new Date() }).returning('*');
  return ok(res, { item });
};
exports.removeItem = async (req, res) => {
  await db('restock_cart_items').where({ id: req.params.id }).delete();
  return noContent(res);
};
exports.convert = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const items = await db('restock_cart_items').where({ restock_cart_id: cart.id });
  if (!items.length) throw require('../utils/AppError')('Cart is empty.', 400);
  const total = items.reduce((s,i) => s + ((i.override_qty||i.suggested_qty) * 0), 0);
  const year = new Date().getFullYear();
  const [{ count }] = await db('purchase_orders').count('id as count');
  const po_number = `PO-${year}-${String(parseInt(count)+1).padStart(4,'0')}`;
  const [po] = await db('purchase_orders').insert({ po_number, supplier_id: req.body.supplier_id, order_date: new Date().toISOString().split('T')[0], expected_delivery: req.body.expected_delivery||null, status:'draft', total_amount: total, source:'restock_cart', restock_cart_id: cart.id, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('purchase_order_items').insert(items.map(i => ({ purchase_order_id: po.id, product_dimension_id: i.product_dimension_id, ordered_qty: i.override_qty||i.suggested_qty, unit_price:0, line_total:0, created_at: new Date() })));
  await db('restock_cart').where({ id: cart.id }).update({ status:'converted', converted_po_id: po.id });
  return created(res, { purchase_order: po });
};
exports.autoSuggest = async (req, res) => {
  const suggestions = await db.raw(`
    SELECT pd.id as product_dimension_id, p.name, pd.sku, p.low_stock_threshold,
      COALESCE(sl.total,0) as current_qty,
      GREATEST(p.low_stock_threshold - COALESCE(sl.total,0), 0) as suggested_qty
    FROM product_dimensions pd JOIN products p ON p.id=pd.product_id
    LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl ON sl.product_dimension_id=pd.id
    WHERE COALESCE(sl.total,0) < p.low_stock_threshold AND pd.is_active=1 AND p.deleted_at IS NULL
    ORDER BY (COALESCE(sl.total,0)/NULLIF(p.low_stock_threshold,0)) ASC LIMIT 20
  `);
  return ok(res, { suggestions: suggestions.rows });
};
