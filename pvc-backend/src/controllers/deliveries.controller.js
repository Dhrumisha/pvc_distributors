// src/controllers/deliveries.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');
const path = require('path');

const nextDelNumber = async () => {
  const [{ count }] = await db('deliveries').count('id as count');
  return `DLV-${new Date().getFullYear()}-${String(parseInt(count)+1).padStart(4,'0')}`;
};

exports.list = async (req, res) => {
  const { page=1, limit=20, status, vehicle_id, from_date, to_date } = req.query;
  const offset = (page-1)*limit;
  let q = db('deliveries as d').join('sales_orders as so','so.id','d.sales_order_id').join('customers as c','c.id','so.customer_id').leftJoin('vehicles as v','v.id','d.vehicle_id');
  if (status)     q = q.where('d.status', status);
  if (vehicle_id) q = q.where('d.vehicle_id', vehicle_id);
  if (from_date)  q = q.where('d.scheduled_date','>=', from_date);
  if (to_date)    q = q.where('d.scheduled_date','<=', to_date);
  const [{ count }] = await q.clone().count('d.id as count');
  const deliveries = await q.clone().select('d.id','d.delivery_number','d.status','d.scheduled_date','d.delivery_type', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer"), db.raw("v.vehicle_number")).orderBy('d.scheduled_date','desc').limit(limit).offset(offset);
  return paginate(res, { deliveries }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { sales_order_id, delivery_type, vehicle_id, scheduled_date, transport_cost=0, cost_to_customer=0, route_group_id, items=[], delivery_notes } = req.body;
  if (!items.length) throw new AppError('At least one item required.', 400);
  const order = await db('sales_orders').where({ id: sales_order_id }).whereIn('status',['confirmed','processing']).first();
  if (!order) throw new AppError('Order not found or not in a dispatchable status.', 422);
  const delivery_number = await nextDelNumber();
  const [delivery] = await db('deliveries').insert({ delivery_number, sales_order_id, delivery_type, vehicle_id: vehicle_id||null, scheduled_date: scheduled_date||null, transport_cost, cost_to_customer, route_group_id: route_group_id||null, delivery_notes, status:'scheduled', ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  await db('delivery_items').insert(items.map(i => ({ delivery_id: delivery.id, sales_order_item_id: i.sales_order_item_id, product_dimension_id: i.product_dimension_id || 0, dispatched_qty: i.dispatched_qty, created_at: new Date() })));
  return created(res, { delivery });
};

exports.getOne = async (req, res) => {
  const delivery = await db('deliveries as d').join('sales_orders as so','so.id','d.sales_order_id').join('customers as c','c.id','so.customer_id').leftJoin('vehicles as v','v.id','d.vehicle_id').where('d.id', req.params.id).select('d.*', db.raw("json_build_object('id',c.id,'business_name',c.business_name,'phone',c.phone) as customer"), db.raw("so.order_number"), db.raw("v.vehicle_number"), db.raw("v.driver_name")).first();
  if (!delivery) throw new AppError('Delivery not found.', 404);
  const items = await db('delivery_items as di').join('sales_order_items as soi','soi.id','di.sales_order_item_id').join('product_dimensions as pd','pd.id','soi.product_dimension_id').join('products as p','p.id','pd.product_id').where('di.delivery_id', delivery.id).select('di.*','p.name','pd.sku');
  return ok(res, { delivery, items, timeline: [] });
};

exports.update = async (req, res) => {
  const [d] = await db('deliveries').where({ id: req.params.id }).whereIn('status',['scheduled','packed']).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  if (!d) throw new AppError('Delivery not found or cannot be edited.', 422);
  return ok(res, { delivery: d });
};

exports.setStatus = async (req, res) => {
  const [d] = await db('deliveries').where({ id: req.params.id }).update({ status: req.body.status, updated_at: new Date() }).returning('*');
  return ok(res, { delivery: d });
};

exports.dispatch = async (req, res) => {
  const delivery = await db('deliveries').where({ id: req.params.id }).whereIn('status',['scheduled','packed']).first();
  if (!delivery) throw new AppError('Delivery not dispatchable.', 422);
  // Deduct stock from ledger
  const items = await db('delivery_items as di').join('sales_order_items as soi','soi.id','di.sales_order_item_id').where('di.delivery_id', delivery.id).select('di.dispatched_qty','soi.product_dimension_id');
  for (const item of items) {
    const [{ total }] = await db('stock_ledger').where({ product_dimension_id: item.product_dimension_id }).sum('qty_change as total');
    const current = parseFloat(total)||0;
    await db('stock_ledger').insert({ product_dimension_id: item.product_dimension_id, qty_change: -item.dispatched_qty, qty_after: current - item.dispatched_qty, txn_type:'dispatched', ref_type:'deliveries', ref_id: delivery.id, notes:`Dispatched in delivery ${delivery.delivery_number}`, created_by: req.user.id, created_at: new Date() });
    await db('sales_order_items').where({ id: item.sales_order_item_id }).increment('dispatched_qty', item.dispatched_qty);
  }
  const [updated] = await db('deliveries').where({ id: delivery.id }).update({ status:'dispatched', dispatched_at: new Date(), updated_at: new Date() }).returning('*');
  return ok(res, { delivery: updated }, 'Delivery dispatched and stock deducted.');
};

exports.confirmDelivery = async (req, res) => {
  const { delivered_at, proof_url, notes } = req.body;
  const delivery = await db('deliveries').where({ id: req.params.id, status: 'dispatched' }).first();
  if (!delivery) throw new AppError('Delivery not found or not dispatched.', 422);
  const [updated] = await db('deliveries').where({ id: delivery.id }).update({ status:'delivered', delivered_at: delivered_at||new Date(), proof_url: proof_url||null, delivery_notes: notes||null, updated_at: new Date() }).returning('*');
  // Update sales order status
  await db('sales_orders').where({ id: delivery.sales_order_id }).update({ status:'delivered', updated_at: new Date() });
  return ok(res, { delivery: updated }, 'Delivery confirmed.');
};

exports.uploadProof = async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  const proof_url = `/uploads/${req.file.filename}`;
  await db('deliveries').where({ id: req.params.id }).update({ proof_url, updated_at: new Date() });
  return ok(res, { proof_url });
};

exports.pending = async (req, res) => {
  const { days_overdue } = req.query;
  let q = db('deliveries as d').join('sales_orders as so','so.id','d.sales_order_id').join('customers as c','c.id','so.customer_id').whereIn('d.status',['dispatched','in_transit']);
  if (days_overdue) q = q.whereRaw(`d.scheduled_date < NOW() - INTERVAL '${parseInt(days_overdue)} days'`);
  const deliveries = await q.select('d.id','d.delivery_number','d.scheduled_date','d.status', db.raw("c.business_name")).orderBy('d.scheduled_date','asc');
  return ok(res, { deliveries });
};

exports.createReturn = async (req, res) => {
  const { product_dimension_id, returned_qty, reason, condition='unknown' } = req.body;
  const [ret] = await db('delivery_returns').insert({ delivery_id: req.params.id, product_dimension_id, returned_qty, reason, condition, stock_action:'pending', received_by: req.user.id, ip_address: req.ip, created_at: new Date() }).returning('*');
  return created(res, { return: ret });
};

exports.getReturns = async (req, res) => {
  const returns = await db('delivery_returns as dr').join('product_dimensions as pd','pd.id','dr.product_dimension_id').join('products as p','p.id','pd.product_id').where('dr.delivery_id', req.params.id).select('dr.*','p.name','pd.sku');
  return ok(res, { returns });
};

// GET /deliveries/returns  — all returns across every delivery
exports.listAllReturns = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const base = db('delivery_returns as dr')
    .join('deliveries as d', 'd.id', 'dr.delivery_id')
    .join('product_dimensions as pd', 'pd.id', 'dr.product_dimension_id')
    .join('products as p', 'p.id', 'pd.product_id');
  const [{ count }] = await base.clone().count('dr.id as count');
  const returns = await base.clone()
    .select('dr.id', 'dr.returned_qty', 'dr.reason', 'dr.condition', 'dr.stock_action', 'dr.created_at',
            'd.delivery_number', 'p.name as product_name', 'pd.sku')
    .orderBy('dr.created_at', 'desc').limit(limit).offset(offset);
  return paginate(res, { returns }, { page, limit, total: count });
};

exports.updateDriverPayment = async (req, res) => {
  const [d] = await db('deliveries').where({ id: req.params.id }).update({ driver_payment: req.body.driver_payment, driver_paid_at: req.body.driver_paid_at||new Date(), updated_at: new Date() }).returning('*');
  return ok(res, { delivery: d });
};
