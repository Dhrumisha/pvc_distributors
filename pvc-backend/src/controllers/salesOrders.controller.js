// src/controllers/salesOrders.controller.js
const db       = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

// ── Helpers ────────────────────────────────────────────────────────────────────
const getCurrentStock = async (productDimensionId) => {
  const [{ total }] = await db('stock_ledger').where({ product_dimension_id: productDimensionId }).sum('qty_change as total');
  return parseFloat(total) || 0;
};

const nextOrderNumber = async () => {
  const year = new Date().getFullYear();
  const [{ count }] = await db('sales_orders').count('id as count');
  return `SO-${year}-${String(parseInt(count)+1).padStart(4,'0')}`;
};

// ── GET / ──────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  const { page=1, limit=20, search, status, customer_id, from_date, to_date, is_template } = req.query;
  const offset = (page-1)*limit;
  let q = db('sales_orders as so').leftJoin('customers as c','c.id','so.customer_id');
  if (search)      q = q.where(b => b.whereILike('so.order_number',`%${search}%`).orWhereILike('c.business_name',`%${search}%`));
  if (status)      q = q.where('so.status', status);
  if (customer_id) q = q.where('so.customer_id', customer_id);
  if (from_date)   q = q.where('so.order_date','>=', from_date);
  if (to_date)     q = q.where('so.order_date','<=', to_date);
  if (is_template !== undefined) q = q.where('so.is_template', is_template);
  const [{ count }] = await q.clone().count('so.id as count');
  const orders = await q.clone()
    .select('so.id','so.order_number','so.status','so.order_date','so.delivery_type','so.total_amount','so.is_template',
      db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer"))
    .orderBy('so.created_at','desc').limit(limit).offset(offset);
  return paginate(res, { orders }, { page, limit, total: count });
};

// ── POST / ────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const { customer_id, delivery_type, delivery_address_id, required_date, quotation_id, notes, items } = req.body;
  if (!items?.length) throw new AppError('At least one item is required.', 400);

  // Credit limit check
  const customer = await db('customers').where({ id: customer_id }).first();
  if (!customer) throw new AppError('Customer not found.', 404);
  if (customer.is_on_hold) throw new AppError('Customer is on hold. Release hold before creating orders.', 422);

  // Check credit
  const [{ outstanding }] = await db('invoices').where({ customer_id, status: ['issued','partially_paid','overdue'] }).sum('balance_due as outstanding').catch(() => [{ outstanding: 0 }]);
  const outstandingAmt = parseFloat(outstanding) || 0;

  const subtotal = items.reduce((s,i) => s + (i.qty * i.unit_price * (1 - (i.discount_pct||0)/100)), 0);
  const taxAmount = items.reduce((s,i) => s + (i.qty * i.unit_price * (i.gst_rate||0)/100), 0);
  const total    = subtotal + taxAmount;

  if (customer.credit_limit > 0 && (outstandingAmt + total) > customer.credit_limit) {
    throw new AppError(`Order would exceed customer credit limit (${customer.credit_limit}). Current outstanding: ${outstandingAmt}.`, 422);
  }

  const order_number = await nextOrderNumber();

  const [order] = await db('sales_orders').insert({
    order_number, customer_id, delivery_type, delivery_address_id: delivery_address_id||null,
    quotation_id: quotation_id||null, required_date: required_date||null, notes, status:'draft',
    order_date: new Date().toISOString().split('T')[0],
    subtotal, tax_amount: taxAmount, total_amount: total,
    ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date()
  }).returning('*');

  // Insert items
  const itemRows = items.map(i => ({
    sales_order_id: order.id, product_dimension_id: i.product_dimension_id,
    ordered_qty: i.qty, dispatched_qty: 0,
    unit_price: i.unit_price, gst_rate: i.gst_rate||0, discount_pct: i.discount_pct||0,
    line_total: i.qty * i.unit_price * (1 - (i.discount_pct||0)/100),
    created_at: new Date()
  }));
  await db('sales_order_items').insert(itemRows);

  return created(res, { order });
};

// ── GET /:id ──────────────────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  const order = await db('sales_orders as so').leftJoin('customers as c','c.id','so.customer_id')
    .where('so.id', req.params.id)
    .select('so.*', db.raw("json_build_object('id',c.id,'business_name',c.business_name,'phone',c.phone) as customer"))
    .first();
  if (!order) throw new AppError('Order not found.', 404);
  const items = await db('sales_order_items as soi').join('product_dimensions as pd','pd.id','soi.product_dimension_id').join('products as p','p.id','pd.product_id').where('soi.sales_order_id', order.id).select('soi.*','p.name','pd.sku','pd.dimension_label','p.unit');
  const deliveries = await db('deliveries').where({ sales_order_id: order.id }).orderBy('created_at','desc');
  const invoices = await db('invoices').where({ sales_order_id: order.id }).orderBy('created_at','desc');
  return ok(res, { order, items, deliveries, invoices });
};

// ── PUT /:id ──────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const order = await db('sales_orders').where({ id: req.params.id, status: 'draft' }).first();
  if (!order) throw new AppError('Only draft orders can be edited.', 422);
  // Log amendment
  const changes = Object.entries(req.body).filter(([k,v]) => order[k] !== v);
  for (const [field, newVal] of changes) {
    await db('order_amendments').insert({ sales_order_id: order.id, field_changed: field, old_value: String(order[field]||''), new_value: String(newVal||''), reason: req.body._reason||null, amended_by: req.user.id, amended_at: new Date() });
  }
  const [updated] = await db('sales_orders').where({ id: order.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { order: updated });
};

// ── PATCH /:id/confirm ────────────────────────────────────────────────────────
exports.confirm = async (req, res) => {
  const order = await db('sales_orders').where({ id: req.params.id, status: 'draft' }).first();
  if (!order) throw new AppError('Order not found or already confirmed.', 422);

  // Check maker-checker threshold
  const threshold = parseFloat(process.env.MAKER_CHECKER_ORDER_THRESHOLD||'0');
  if (threshold > 0 && order.total_amount >= threshold && !order.approved_by) {
    throw new AppError('This order requires admin approval before confirmation.', 422);
  }

  const items = await db('sales_order_items').where({ sales_order_id: order.id });
  // Reserve stock
  for (const item of items) {
    const current = await getCurrentStock(item.product_dimension_id);
    if (current < item.ordered_qty) throw new AppError(`Insufficient stock for SKU ID ${item.product_dimension_id}. Available: ${current}, Requested: ${item.ordered_qty}`, 422);
    await db('stock_ledger').insert({ product_dimension_id: item.product_dimension_id, qty_change: -item.ordered_qty, qty_after: current - item.ordered_qty, txn_type:'reservation', ref_type:'sales_order', ref_id: order.id, notes:`Reserved for order ${order.order_number}`, created_by: req.user.id, created_at: new Date() });
  }

  const [updated] = await db('sales_orders').where({ id: order.id }).update({ status:'confirmed', updated_at: new Date() }).returning('*');
  return ok(res, { order: updated }, 'Order confirmed and stock reserved.');
};

// ── PATCH /:id/cancel ─────────────────────────────────────────────────────────
exports.cancel = async (req, res) => {
  const order = await db('sales_orders').where({ id: req.params.id }).whereIn('status',['draft','confirmed','processing']).first();
  if (!order) throw new AppError('Order cannot be cancelled in its current status.', 422);

  if (order.status === 'confirmed') {
    // Release reservations
    const items = await db('sales_order_items').where({ sales_order_id: order.id });
    for (const item of items) {
      const current = await getCurrentStock(item.product_dimension_id);
      await db('stock_ledger').insert({ product_dimension_id: item.product_dimension_id, qty_change: item.ordered_qty - item.dispatched_qty, qty_after: current + (item.ordered_qty - item.dispatched_qty), txn_type:'reservation_release', ref_type:'sales_order', ref_id: order.id, notes:`Released: ${req.body.reason}`, created_by: req.user.id, created_at: new Date() });
    }
  }

  await db('order_amendments').insert({ sales_order_id: order.id, field_changed:'status', old_value: order.status, new_value:'cancelled', reason: req.body.reason, amended_by: req.user.id, amended_at: new Date() });
  const [updated] = await db('sales_orders').where({ id: order.id }).update({ status:'cancelled', updated_at: new Date() }).returning('*');
  return ok(res, { order: updated }, 'Order cancelled.');
};

exports.approve = async (req, res) => {
  const [order] = await db('sales_orders').where({ id: req.params.id }).update({ approved_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { order }, 'Order approved.');
};

exports.getAmendments = async (req, res) => {
  const amendments = await db('order_amendments as oa').leftJoin('auth_users as u','u.id','oa.amended_by').where('oa.sales_order_id', req.params.id).select('oa.*', db.raw("u.name as amended_by_name")).orderBy('oa.amended_at','desc');
  return ok(res, { amendments });
};

exports.stockCheck = async (req, res) => {
  const items = await db('sales_order_items').where({ sales_order_id: req.params.id });
  const result = await Promise.all(items.map(async item => {
    const current = await getCurrentStock(item.product_dimension_id);
    return { product_dimension_id: item.product_dimension_id, required: item.ordered_qty, available: current, status: current >= item.ordered_qty ? 'available' : 'insufficient' };
  }));
  return ok(res, { items: result });
};

exports.getTemplates = async (req, res) => {
  const { customer_id } = req.query;
  let q = db('sales_orders as so').leftJoin('customers as c','c.id','so.customer_id').where('so.is_template',1);
  if (customer_id) q = q.where('so.customer_id', customer_id);
  const templates = await q.select('so.id','so.template_name','so.total_amount', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer"));
  return ok(res, { templates });
};

exports.saveTemplate = async (req, res) => {
  const [order] = await db('sales_orders').where({ id: req.params.id }).update({ is_template: 1, template_name: req.body.template_name, updated_at: new Date() }).returning('*');
  return ok(res, { order }, 'Saved as template.');
};

exports.fromTemplate = async (req, res) => {
  const template = await db('sales_orders').where({ id: req.params.id, is_template: 1 }).first();
  if (!template) throw new AppError('Template not found.', 404);
  const items = await db('sales_order_items').where({ sales_order_id: template.id });
  // Create a new draft order from this template
  const order_number = await nextOrderNumber();
  const [order] = await db('sales_orders').insert({ ...template, id: undefined, order_number, status:'draft', is_template:0, template_name:null, customer_id: req.body.customer_id||template.customer_id, required_date: req.body.required_date||null, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('sales_order_items').insert(items.map(i => ({ ...i, id: undefined, sales_order_id: order.id, dispatched_qty:0, created_at: new Date() })));
  return created(res, { order });
};
