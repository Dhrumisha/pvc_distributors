// src/controllers/purchaseOrders.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

const nextPoNumber = async () => {
  const year = new Date().getFullYear();
  const [{ count }] = await db('purchase_orders').count('id as count');
  return `PO-${year}-${String(parseInt(count)+1).padStart(4,'0')}`;
};

exports.list = async (req, res) => {
  const { page=1, limit=20, supplier_id, status, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('purchase_orders as po').leftJoin('suppliers as s','s.id','po.supplier_id');
  if (supplier_id) q = q.where('po.supplier_id', supplier_id);
  if (status)      q = q.where('po.status', status);
  if (from_date)   q = q.where('po.order_date','>=', from_date);
  if (to_date)     q = q.where('po.order_date','<=', to_date);
  const [{ count }] = await q.clone().count('po.id as count');
  const orders = await q.clone().select('po.*', db.raw("json_build_object('id',s.id,'name',s.name) as supplier")).orderBy('po.order_date','desc').limit(limit).offset(offset);
  return paginate(res, { orders }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { supplier_id, order_date, expected_delivery, notes, items=[] } = req.body;
  if (!items.length) throw new AppError('At least one item required.', 400);
  const total = items.reduce((s,i) => s + (i.ordered_qty * i.unit_price), 0);
  const po_number = await nextPoNumber();
  const [order] = await db('purchase_orders').insert({ po_number, supplier_id, order_date, expected_delivery: expected_delivery||null, notes, status:'draft', total_amount: total, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('purchase_order_items').insert(items.map(i => ({ purchase_order_id: order.id, product_dimension_id: i.product_dimension_id, ordered_qty: i.ordered_qty, unit_price: i.unit_price, gst_rate: i.gst_rate||0, line_total: i.ordered_qty*i.unit_price, created_at: new Date() })));
  return created(res, { order });
};

exports.getOne = async (req, res) => {
  const order = await db('purchase_orders as po').leftJoin('suppliers as s','s.id','po.supplier_id').where('po.id', req.params.id).select('po.*', db.raw("json_build_object('id',s.id,'name',s.name,'phone',s.phone) as supplier")).first();
  if (!order) throw new AppError('Purchase order not found.', 404);
  const items = await db('purchase_order_items as poi').join('product_dimensions as pd','pd.id','poi.product_dimension_id').join('products as p','p.id','pd.product_id').where('poi.purchase_order_id', order.id).select('poi.*','p.name','pd.sku');
  const receipts = await db('goods_receipts').where({ purchase_order_id: order.id }).orderBy('received_date','desc');
  return ok(res, { order, items, receipts });
};

exports.update = async (req, res) => {
  const order = await db('purchase_orders').where({ id: req.params.id }).whereIn('status',['draft','sent']).first();
  if (!order) throw new AppError('Only draft or sent POs can be edited.', 422);
  const [updated] = await db('purchase_orders').where({ id: order.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { order: updated });
};

exports.setStatus = async (req, res) => {
  const [order] = await db('purchase_orders').where({ id: req.params.id }).update({ status: req.body.status, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { order });
};

exports.remove = async (req, res) => {
  const deleted = await db('purchase_orders').where({ id: req.params.id, status: 'draft' }).delete();
  if (!deleted) throw new AppError('Only draft POs can be deleted.', 422);
  return noContent(res);
};

exports.approve = async (req, res) => {
  const [order] = await db('purchase_orders').where({ id: req.params.id }).update({ approved_by: req.user.id, status: 'approved', updated_at: new Date() }).returning('*');
  return ok(res, { order }, 'PO approved.');
};

exports.receive = async (req, res) => {
  const { received_date, batch_lot_id, items=[] } = req.body;
  const order = await db('purchase_orders').where({ id: req.params.id }).first();
  if (!order) throw new AppError('Purchase order not found.', 404);
  const [receipt] = await db('goods_receipts').insert({ purchase_order_id: order.id, batch_lot_id: batch_lot_id||null, received_date, received_by: req.user.id, created_at: new Date() }).returning('*');
  const stockEntries = [];
  for (const item of items) {
    const accepted = item.received_qty - (item.damaged_qty||0);
    await db('goods_receipt_items').insert({ goods_receipt_id: receipt.id, purchase_order_item_id: item.purchase_order_item_id, received_qty: item.received_qty, damaged_qty: item.damaged_qty||0, accepted_qty: accepted, created_at: new Date() });
    // Get PO item to find product_dimension_id
    const poi = await db('purchase_order_items').where({ id: item.purchase_order_item_id }).first();
    if (poi && accepted > 0) {
      const [{ total }] = await db('stock_ledger').where({ product_dimension_id: poi.product_dimension_id }).sum('qty_change as total');
      const current = parseFloat(total)||0;
      const [entry] = await db('stock_ledger').insert({ product_dimension_id: poi.product_dimension_id, batch_lot_id: batch_lot_id||null, qty_change: accepted, qty_after: current+accepted, txn_type:'goods_received', ref_type:'goods_receipt', ref_id: receipt.id, notes:`GR ${receipt.id} from PO ${order.po_number}`, created_by: req.user.id, created_at: new Date() }).returning('*');
      stockEntries.push(entry);
      // Update received_qty on PO item
      await db('purchase_order_items').where({ id: poi.id }).increment('received_qty', accepted);
    }
    if (item.damaged_qty > 0) {
      const [{ total }] = await db('stock_ledger').where({ product_dimension_id: poi.product_dimension_id }).sum('qty_change as total');
      const current = parseFloat(total)||0;
      await db('stock_ledger').insert({ product_dimension_id: poi.product_dimension_id, batch_lot_id: batch_lot_id||null, qty_change: item.damaged_qty, qty_after: current+item.damaged_qty, txn_type:'damage', ref_type:'goods_receipt', ref_id: receipt.id, notes:`Damaged on receipt — PO ${order.po_number}`, created_by: req.user.id, created_at: new Date() });
    }
  }
  // Update PO status
  const allItems = await db('purchase_order_items').where({ purchase_order_id: order.id });
  const allReceived = allItems.every(i => parseFloat(i.received_qty) >= parseFloat(i.ordered_qty));
  if (allReceived) await db('purchase_orders').where({ id: order.id }).update({ status:'received', actual_delivery: received_date, updated_at: new Date() });
  else await db('purchase_orders').where({ id: order.id }).update({ status:'partially_received', updated_at: new Date() });
  return created(res, { receipt, stock_entries: stockEntries });
};

exports.getReceipts = async (req, res) => {
  const receipts = await db('goods_receipts as gr').where({ purchase_order_id: req.params.id })
    .leftJoin('auth_users as u','u.id','gr.received_by')
    .select('gr.*', db.raw("u.name as received_by_name")).orderBy('received_date','desc');
  return ok(res, { receipts });
};

// GET /purchase-orders/receipts  — all goods receipts across every PO
exports.listAllReceipts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const base = db('goods_receipts as gr')
    .join('purchase_orders as po', 'po.id', 'gr.purchase_order_id')
    .leftJoin('suppliers as s', 's.id', 'po.supplier_id')
    .leftJoin('auth_users as u', 'u.id', 'gr.received_by');
  const [{ count }] = await base.clone().count('gr.id as count');
  const receipts = await base.clone()
    .select('gr.id', 'gr.received_date', 'gr.status', 'po.po_number', 's.name as supplier_name', db.raw('u.name as received_by_name'))
    .orderBy('gr.received_date', 'desc').limit(limit).offset(offset);
  return paginate(res, { receipts }, { page, limit, total: count });
};
