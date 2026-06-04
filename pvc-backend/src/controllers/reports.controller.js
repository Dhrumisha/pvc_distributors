// src/controllers/reports.controller.js
const db  = require('../config/db');
const { ok } = require('../utils/response');

// ── Helpers ────────────────────────────────────────────────────────────────────
const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]).join(',');
  const lines   = rows.map(r => Object.values(r).map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','));
  return [headers, ...lines].join('\n');
};

const sendReport = (res, rows, format, filename) => {
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(toCsv(rows));
  }
  return ok(res, { rows, summary: { total_rows: rows.length } });
};

const parseRange = (q) => ({ from: q.from_date, to: q.to_date });

// ── Sales Report ───────────────────────────────────────────────────────────────
exports.sales = async (req, res) => {
  const { from_date, to_date, customer_id, format='json' } = req.query;
  let q = db('invoices as i').join('customers as c','c.id','i.customer_id')
    .where('i.status','!=','cancelled');
  if (from_date)   q = q.where('i.invoice_date','>=',from_date);
  if (to_date)     q = q.where('i.invoice_date','<=',to_date);
  if (customer_id) q = q.where('i.customer_id',customer_id);
  const rows = await q.select('i.invoice_number','i.invoice_date','c.business_name as customer','i.total_amount','i.paid_amount','i.balance_due','i.status').orderBy('i.invoice_date','desc');
  return sendReport(res, rows, format, 'sales-report');
};

// ── Purchase Report ────────────────────────────────────────────────────────────
exports.purchases = async (req, res) => {
  const { from_date, to_date, supplier_id, format='json' } = req.query;
  let q = db('purchase_orders as po').join('suppliers as s','s.id','po.supplier_id');
  if (from_date)   q = q.where('po.order_date','>=',from_date);
  if (to_date)     q = q.where('po.order_date','<=',to_date);
  if (supplier_id) q = q.where('po.supplier_id',supplier_id);
  const rows = await q.select('po.po_number','po.order_date','s.name as supplier','po.total_amount','po.status').orderBy('po.order_date','desc');
  return sendReport(res, rows, format, 'purchase-report');
};

// ── Profit & Loss ─────────────────────────────────────────────────────────────
exports.profitLoss = async (req, res) => {
  const { from_date, to_date, format='json' } = req.query;
  let q = db.raw(`
    SELECT so.order_number, c.business_name as customer, so.order_date,
      SUM(soi.ordered_qty * soi.unit_price) as revenue,
      SUM(soi.ordered_qty * pd.purchase_price) as cost,
      SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price) as gross_profit,
      ROUND(((SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price)) / NULLIF(SUM(soi.ordered_qty * soi.unit_price),0)) * 100, 2) as margin_pct
    FROM sales_orders so
    JOIN customers c ON c.id = so.customer_id
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    JOIN product_dimensions pd ON pd.id = soi.product_dimension_id
    WHERE so.status NOT IN ('draft','cancelled')
    ${from_date ? `AND so.order_date >= '${from_date}'` : ''}
    ${to_date   ? `AND so.order_date <= '${to_date}'`   : ''}
    GROUP BY so.id, so.order_number, c.business_name, so.order_date
    ORDER BY so.order_date DESC
  `);
  const rows = (await q).rows;
  return sendReport(res, rows, format, 'profit-loss');
};

// ── Stock Report ──────────────────────────────────────────────────────────────
exports.stock = async (req, res) => {
  const { category_id, format='json' } = req.query;
  let q = db.raw(`
    SELECT p.name as product, c.name as category, pd.sku, pd.dimension_label,
      COALESCE(sl.total, 0) as current_qty, p.unit,
      COALESCE(sl.total, 0) * pd.purchase_price as stock_value_cost,
      COALESCE(sl.total, 0) * pd.selling_price as stock_value_sell
    FROM product_dimensions pd
    JOIN products p ON p.id = pd.product_id
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl
      ON sl.product_dimension_id = pd.id
    WHERE pd.is_active = 1 AND p.deleted_at IS NULL
    ${category_id ? `AND p.category_id = ${category_id}` : ''}
    ORDER BY p.name, pd.sku
  `);
  const rows = (await q).rows;
  return sendReport(res, rows, format, 'stock-report');
};

// ── Stock Movement ────────────────────────────────────────────────────────────
exports.stockMovement = async (req, res) => {
  const { from_date, to_date, product_id, txn_type, format='json' } = req.query;
  let q = db('stock_ledger as sl').join('product_dimensions as pd','pd.id','sl.product_dimension_id').join('products as p','p.id','pd.product_id').leftJoin('auth_users as u','u.id','sl.created_by');
  if (from_date) q = q.where('sl.created_at','>=',from_date);
  if (to_date)   q = q.where('sl.created_at','<=',to_date);
  if (product_id)q = q.where('p.id',product_id);
  if (txn_type)  q = q.where('sl.txn_type',txn_type);
  const rows = await q.select('sl.created_at','p.name as product','pd.sku','sl.txn_type','sl.qty_change','sl.qty_after','sl.notes', db.raw("u.name as performed_by")).orderBy('sl.created_at','desc').limit(500);
  return sendReport(res, rows, format, 'stock-movement');
};

// ── Dead Stock ────────────────────────────────────────────────────────────────
exports.deadStock = async (req, res) => {
  const { days=60, format='json' } = req.query;
  const rows = (await db.raw(`
    SELECT p.name as product, pd.sku, pd.dimension_label,
      COALESCE(sl.total,0) as current_qty,
      MAX(sl_last.created_at) as last_movement
    FROM product_dimensions pd
    JOIN products p ON p.id = pd.product_id
    LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl ON sl.product_dimension_id = pd.id
    LEFT JOIN stock_ledger sl_last ON sl_last.product_dimension_id = pd.id
    WHERE pd.is_active = 1 AND p.deleted_at IS NULL
    GROUP BY p.name, pd.sku, pd.dimension_label, sl.total
    HAVING MAX(sl_last.created_at) < NOW() - INTERVAL '${parseInt(days)} days' OR MAX(sl_last.created_at) IS NULL
    ORDER BY last_movement ASC NULLS FIRST
  `)).rows;
  return sendReport(res, rows, format, 'dead-stock');
};

// ── Payments ──────────────────────────────────────────────────────────────────
exports.payments = async (req, res) => {
  const { from_date, to_date, customer_id, mode, format='json' } = req.query;
  let q = db('customer_payments as cp').join('customers as c','c.id','cp.customer_id').join('invoices as i','i.id','cp.invoice_id');
  if (from_date)   q = q.where('cp.payment_date','>=',from_date);
  if (to_date)     q = q.where('cp.payment_date','<=',to_date);
  if (customer_id) q = q.where('cp.customer_id',customer_id);
  if (mode)        q = q.where('cp.mode',mode);
  const rows = await q.select('cp.payment_date','c.business_name as customer','i.invoice_number','cp.amount','cp.mode','cp.reference_number','cp.tds_amount').orderBy('cp.payment_date','desc');
  return sendReport(res, rows, format, 'payments');
};

// ── Outstanding ───────────────────────────────────────────────────────────────
exports.outstanding = async (req, res) => {
  const { customer_id, format='json' } = req.query;
  let q = db('customers as c').leftJoin(
    db('invoices').whereIn('status',['issued','partially_paid','overdue']).select('customer_id').sum('balance_due as total_due').groupBy('customer_id').as('inv'),
    'inv.customer_id','c.id'
  ).whereNotNull('inv.total_due');
  if (customer_id) q = q.where('c.id',customer_id);
  const rows = await q.select('c.business_name as customer','c.phone', db.raw('COALESCE(inv.total_due,0) as outstanding')).orderBy('outstanding','desc');
  return sendReport(res, rows, format, 'outstanding');
};

// ── Aging ─────────────────────────────────────────────────────────────────────
exports.aging = async (req, res) => {
  const { customer_id, format='json' } = req.query;
  const rows = (await db.raw(`
    SELECT c.business_name as customer,
      SUM(CASE WHEN NOW()-i.due_date BETWEEN INTERVAL '0' AND INTERVAL '30 days' THEN i.balance_due ELSE 0 END) as "0_30",
      SUM(CASE WHEN NOW()-i.due_date BETWEEN INTERVAL '31 days' AND INTERVAL '60 days' THEN i.balance_due ELSE 0 END) as "31_60",
      SUM(CASE WHEN NOW()-i.due_date BETWEEN INTERVAL '61 days' AND INTERVAL '90 days' THEN i.balance_due ELSE 0 END) as "61_90",
      SUM(CASE WHEN NOW()-i.due_date > INTERVAL '90 days' THEN i.balance_due ELSE 0 END) as "over_90",
      SUM(i.balance_due) as total_due
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    WHERE i.status IN ('issued','partially_paid','overdue')
    ${customer_id ? `AND i.customer_id = ${customer_id}` : ''}
    GROUP BY c.id, c.business_name
    HAVING SUM(i.balance_due) > 0
    ORDER BY total_due DESC
  `)).rows;
  return sendReport(res, rows, format, 'aging');
};

// ── GST (GSTR-1 style) ────────────────────────────────────────────────────────
exports.gst = async (req, res) => {
  const { month = new Date().getMonth()+1, year = new Date().getFullYear(), format='json' } = req.query;
  const rows = (await db.raw(`
    SELECT p.hsn_code, SUM(ii.qty * ii.unit_price) as taxable_value,
      SUM(ii.cgst_amount) as cgst, SUM(ii.sgst_amount) as sgst, SUM(ii.igst_amount) as igst,
      SUM(ii.cgst_amount + ii.sgst_amount + ii.igst_amount) as total_tax,
      SUM(ii.line_total) as invoice_value
    FROM invoice_items ii
    JOIN invoices i ON i.id = ii.invoice_id
    JOIN product_dimensions pd ON pd.id = ii.product_dimension_id
    JOIN products p ON p.id = pd.product_id
    WHERE EXTRACT(MONTH FROM i.invoice_date) = ${month}
      AND EXTRACT(YEAR FROM i.invoice_date) = ${year}
      AND i.status != 'cancelled'
    GROUP BY p.hsn_code
    ORDER BY taxable_value DESC
  `)).rows;
  return sendReport(res, rows, format, `gst-${year}-${month}`);
};

// ── Customer Profitability ────────────────────────────────────────────────────
exports.customerProfitability = async (req, res) => {
  const { from_date, to_date, format='json' } = req.query;
  const rows = (await db.raw(`
    SELECT c.business_name as customer,
      SUM(soi.ordered_qty * soi.unit_price) as revenue,
      SUM(soi.ordered_qty * pd.purchase_price) as cost,
      SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price) as gross_profit,
      ROUND(((SUM(soi.ordered_qty * soi.unit_price) - SUM(soi.ordered_qty * pd.purchase_price)) / NULLIF(SUM(soi.ordered_qty * soi.unit_price),0)) * 100, 2) as margin_pct
    FROM sales_orders so
    JOIN customers c ON c.id = so.customer_id
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    JOIN product_dimensions pd ON pd.id = soi.product_dimension_id
    WHERE so.status NOT IN ('draft','cancelled')
    ${from_date ? `AND so.order_date >= '${from_date}'` : ''}
    ${to_date   ? `AND so.order_date <= '${to_date}'`   : ''}
    GROUP BY c.id, c.business_name
    ORDER BY revenue DESC
  `)).rows;
  return sendReport(res, rows, format, 'customer-profitability');
};

// ── Sales Staff ───────────────────────────────────────────────────────────────
exports.salesStaff = async (req, res) => {
  const { from_date, to_date, format='json' } = req.query;
  const rows = (await db.raw(`
    SELECT u.name as staff, COUNT(so.id) as order_count, SUM(so.total_amount) as total_revenue
    FROM sales_orders so
    JOIN auth_users u ON u.id = so.created_by
    WHERE so.status NOT IN ('draft','cancelled')
    ${from_date ? `AND so.order_date >= '${from_date}'` : ''}
    ${to_date   ? `AND so.order_date <= '${to_date}'`   : ''}
    GROUP BY u.id, u.name
    ORDER BY total_revenue DESC
  `)).rows;
  return sendReport(res, rows, format, 'sales-staff');
};

// ── Supplier Price Trend ──────────────────────────────────────────────────────
exports.supplierPriceTrend = async (req, res) => {
  const { supplier_id, product_dimension_id, format='json' } = req.query;
  let q = db('supplier_price_history as sph').join('suppliers as s','s.id','sph.supplier_id').join('product_dimensions as pd','pd.id','sph.product_dimension_id').join('products as p','p.id','pd.product_id');
  if (supplier_id)          q = q.where('sph.supplier_id',supplier_id);
  if (product_dimension_id) q = q.where('sph.product_dimension_id',product_dimension_id);
  const rows = await q.select('sph.effective_date','s.name as supplier','p.name as product','pd.sku','sph.price','sph.notes').orderBy('sph.effective_date','desc').limit(200);
  return sendReport(res, rows, format, 'supplier-price-trend');
};

// ── Deliveries ────────────────────────────────────────────────────────────────
exports.deliveries = async (req, res) => {
  const { from_date, to_date, status, vehicle_id, format='json' } = req.query;
  let q = db('deliveries as d').join('sales_orders as so','so.id','d.sales_order_id').join('customers as c','c.id','so.customer_id').leftJoin('vehicles as v','v.id','d.vehicle_id');
  if (from_date) q = q.where('d.scheduled_date','>=',from_date);
  if (to_date)   q = q.where('d.scheduled_date','<=',to_date);
  if (status)    q = q.where('d.status',status);
  if (vehicle_id)q = q.where('d.vehicle_id',vehicle_id);
  const rows = await q.select('d.delivery_number','so.order_number','c.business_name as customer','d.status','d.scheduled_date','d.delivered_at','d.transport_cost', db.raw("v.vehicle_number")).orderBy('d.scheduled_date','desc');
  return sendReport(res, rows, format, 'deliveries');
};
