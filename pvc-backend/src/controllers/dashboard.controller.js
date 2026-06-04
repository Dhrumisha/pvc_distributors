// src/controllers/dashboard.controller.js
const db = require('../config/db');
const { ok } = require('../utils/response');

exports.summary = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [ordersToday] = await db('sales_orders').where('order_date', today).count('id as count');
  const [pendingDel]  = await db('deliveries').whereIn('status',['scheduled','packed','dispatched','in_transit']).count('id as count');
  const [lowStock]    = await db.raw(`
    SELECT COUNT(*) as count FROM product_dimensions pd
    JOIN products p ON p.id = pd.product_id
    LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl
      ON sl.product_dimension_id = pd.id
    WHERE COALESCE(sl.total, 0) < p.low_stock_threshold AND pd.is_active = 1 AND p.deleted_at IS NULL
  `);
  const [receivable]  = await db('invoices').whereIn('status',['issued','partially_paid','overdue']).sum('balance_due as total');
  const [overdueInv]  = await db('invoices').where('status','overdue').count('id as count');

  return ok(res, {
    orders_today:       parseInt(ordersToday.count),
    pending_deliveries: parseInt(pendingDel.count),
    low_stock_count:    parseInt(lowStock.rows[0].count),
    pending_receivable: parseFloat(receivable.total) || 0,
    overdue_invoices:   parseInt(overdueInv.count),
  });
};

exports.activity = async (_req, res) => {
  const activities = await db('audit_logs as al')
    .leftJoin('auth_users as u','u.id','al.user_id')
    .select('al.id','al.module','al.action','al.created_at', db.raw("u.name as user_name"))
    .orderBy('al.created_at','desc').limit(20);
  return ok(res, { activities: activities.map(a => ({ ...a, description: `${a.user_name || 'System'} ${a.action}d a ${a.module} record`, time: a.created_at })) });
};

exports.lowStock = async (_req, res) => {
  const items = await db.raw(`
    SELECT pd.id, p.name, pd.sku, pd.dimension_label, p.low_stock_threshold,
      COALESCE(sl.total, 0) as current_qty
    FROM product_dimensions pd
    JOIN products p ON p.id = pd.product_id
    LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl
      ON sl.product_dimension_id = pd.id
    WHERE COALESCE(sl.total, 0) < p.low_stock_threshold AND pd.is_active = 1 AND p.deleted_at IS NULL
    ORDER BY (COALESCE(sl.total,0) - p.low_stock_threshold) ASC
    LIMIT 10
  `);
  return ok(res, { items: items.rows });
};

exports.overduePayments = async (req, res) => {
  const limit = parseInt(req.query.limit || '5');
  const invoices = await db('invoices as i')
    .join('customers as c','c.id','i.customer_id')
    .where('i.status','overdue')
    .select('i.id','i.invoice_number','i.due_date','i.balance_due', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer"))
    .orderBy('i.due_date','asc').limit(limit);
  return ok(res, { invoices });
};

exports.pendingDeliveries = async (_req, res) => {
  const deliveries = await db('deliveries as d')
    .join('sales_orders as so','so.id','d.sales_order_id')
    .join('customers as c','c.id','so.customer_id')
    .whereIn('d.status',['dispatched','in_transit'])
    .select('d.id','d.delivery_number','d.status','d.scheduled_date', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer"))
    .orderBy('d.scheduled_date','asc').limit(10);
  return ok(res, { deliveries });
};

exports.revenueChart = async (req, res) => {
  const range = req.query.range || '30d';
  let sql, params;

  if (range === '7d') {
    sql = `SELECT TO_CHAR(invoice_date,'YYYY-MM-DD') as label, SUM(total_amount) as value FROM invoices WHERE invoice_date >= CURRENT_DATE - INTERVAL '7 days' AND status != 'cancelled' GROUP BY label ORDER BY label`;
  } else if (range === '12m') {
    sql = `SELECT TO_CHAR(DATE_TRUNC('month', invoice_date),'Mon YYYY') as label, SUM(total_amount) as value FROM invoices WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months' AND status != 'cancelled' GROUP BY DATE_TRUNC('month', invoice_date), label ORDER BY DATE_TRUNC('month', invoice_date)`;
  } else {
    sql = `SELECT TO_CHAR(invoice_date,'DD Mon') as label, SUM(total_amount) as value FROM invoices WHERE invoice_date >= CURRENT_DATE - INTERVAL '30 days' AND status != 'cancelled' GROUP BY invoice_date, label ORDER BY invoice_date`;
  }

  const result = await db.raw(sql);
  const rows   = result.rows;
  return ok(res, { labels: rows.map(r => r.label), values: rows.map(r => parseFloat(r.value)||0) });
};
