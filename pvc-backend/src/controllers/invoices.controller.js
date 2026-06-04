// src/controllers/invoices.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

const nextInvNumber = async () => {
  const year = new Date().getFullYear();
  const [{ count }] = await db('invoices').count('id as count');
  return `INV-${year}-${String(parseInt(count)+1).padStart(5,'0')}`;
};

exports.list = async (req, res) => {
  const { page=1, limit=20, customer_id, status, from_date, to_date, overdue_only } = req.query;
  const offset = (page-1)*limit;
  let q = db('invoices as i').leftJoin('customers as c','c.id','i.customer_id');
  if (customer_id)  q = q.where('i.customer_id', customer_id);
  if (status)       q = q.where('i.status', status);
  if (from_date)    q = q.where('i.invoice_date','>=', from_date);
  if (to_date)      q = q.where('i.invoice_date','<=', to_date);
  if (overdue_only) q = q.where('i.status','overdue');
  const [{ count }] = await q.clone().count('i.id as count');
  const invoices = await q.clone().select('i.id','i.invoice_number','i.invoice_date','i.due_date','i.status','i.total_amount','i.paid_amount','i.balance_due', db.raw("json_build_object('id',c.id,'business_name',c.business_name) as customer")).orderBy('i.invoice_date','desc').limit(limit).offset(offset);
  return paginate(res, { invoices }, { page, limit, total: count });
};

exports.create = async (req, res) => {
  const { sales_order_id, delivery_id, invoice_date, due_date, notes, transport_charge=0 } = req.body;
  const order = await db('sales_orders').where({ id: sales_order_id }).first();
  if (!order) throw new AppError('Sales order not found.', 404);
  const invoice_number = await nextInvNumber();
  const [invoice] = await db('invoices').insert({
    invoice_number, sales_order_id, delivery_id: delivery_id||null,
    customer_id: order.customer_id, invoice_date, due_date: due_date || new Date(),
    status: 'draft', subtotal: order.subtotal, tax_amount: order.tax_amount,
    transport_charge, total_amount: order.total_amount + parseFloat(transport_charge),
    paid_amount: 0, balance_due: order.total_amount + parseFloat(transport_charge),
    notes, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date()
  }).returning('*');
  // Copy line items from sales order
  const soItems = await db('sales_order_items').where({ sales_order_id });
  if (soItems.length) {
    await db('invoice_items').insert(soItems.map(i => ({
      invoice_id: invoice.id, sales_order_item_id: i.id, product_dimension_id: i.product_dimension_id,
      qty: i.ordered_qty, unit_price: i.unit_price, gst_rate: i.gst_rate,
      cgst_amount: (i.line_total * i.gst_rate/100)/2,
      sgst_amount: (i.line_total * i.gst_rate/100)/2,
      igst_amount: 0, discount_pct: i.discount_pct, line_total: i.line_total,
      created_at: new Date()
    })));
  }
  return created(res, { invoice });
};

exports.getOne = async (req, res) => {
  const invoice = await db('invoices as i').leftJoin('customers as c','c.id','i.customer_id').where('i.id', req.params.id).select('i.*', db.raw("json_build_object('id',c.id,'business_name',c.business_name,'phone',c.phone,'gst_number',c.gst_number) as customer")).first();
  if (!invoice) throw new AppError('Invoice not found.', 404);
  const items = await db('invoice_items as ii').join('product_dimensions as pd','pd.id','ii.product_dimension_id').join('products as p','p.id','pd.product_id').where('ii.invoice_id', invoice.id).select('ii.*','p.name','pd.sku','pd.dimension_label','p.hsn_code','p.unit');
  const payments = await db('customer_payments').where({ invoice_id: invoice.id }).orderBy('payment_date','desc');
  return ok(res, { invoice, items, payments });
};

exports.update = async (req, res) => {
  const inv = await db('invoices').where({ id: req.params.id, status: 'draft' }).first();
  if (!inv) throw new AppError('Only draft invoices can be edited.', 422);
  // Log revision
  await db('audit_logs').insert({ user_id: req.user.id, module:'invoices', action:'update', table_name:'invoices', record_id: inv.id, old_data: JSON.stringify(inv), new_data: JSON.stringify(req.body), ip_address: req.ip, created_at: new Date() });
  const [updated] = await db('invoices').where({ id: inv.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { invoice: updated });
};

exports.issue = async (req, res) => {
  const [invoice] = await db('invoices').where({ id: req.params.id, status: 'draft' }).update({ status: 'issued', updated_at: new Date() }).returning('*');
  if (!invoice) throw new AppError('Invoice not found or already issued.', 422);
  // Debit customer ledger
  const [{ balance }] = await db('customer_ledger').where({ customer_id: invoice.customer_id }).orderBy('id','desc').limit(1).select('balance').catch(() => [{ balance: 0 }]);
  await db('customer_ledger').insert({ customer_id: invoice.customer_id, txn_date: invoice.invoice_date, txn_type:'invoice', ref_type:'invoices', ref_id: invoice.id, debit: invoice.total_amount, credit: 0, balance: (parseFloat(balance)||0) + invoice.total_amount, description: `Invoice ${invoice.invoice_number}`, created_at: new Date() });
  return ok(res, { invoice }, 'Invoice issued.');
};

exports.cancel = async (req, res) => {
  const [invoice] = await db('invoices').where({ id: req.params.id }).whereNotIn('status',['cancelled']).update({ status: 'cancelled', updated_at: new Date() }).returning('*');
  if (!invoice) throw new AppError('Invoice not found or already cancelled.', 422);
  return ok(res, { invoice }, 'Invoice cancelled.');
};

exports.getPdf = async (req, res) => {
  // Real PDF generation would use pdfkit/puppeteer — returns placeholder for now
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
  res.send(Buffer.from(`Invoice PDF for ID ${req.params.id}`));
};

exports.share = async (req, res) => {
  const { channel, recipient } = req.body;
  // TODO: integrate Twilio/Nodemailer
  return ok(res, null, `Invoice shared via ${channel} to ${recipient}.`);
};

exports.duplicate = async (req, res) => {
  const original = await db('invoices').where({ id: req.params.id }).first();
  if (!original) throw new AppError('Invoice not found.', 404);
  const invoice_number = await nextInvNumber();
  const [copy] = await db('invoices').insert({ ...original, id: undefined, invoice_number, status:'draft', paid_amount:0, balance_due: original.total_amount, irn_number: null, irn_generated_at: null, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  const items = await db('invoice_items').where({ invoice_id: original.id });
  if (items.length) await db('invoice_items').insert(items.map(i => ({ ...i, id: undefined, invoice_id: copy.id, created_at: new Date() })));
  return created(res, { invoice: copy });
};

exports.generateIrn = async (req, res) => {
  // TODO: implement real GST IRP API call
  const irn_number = `IRN-${Date.now()}-${req.params.id}`;
  const [invoice] = await db('invoices').where({ id: req.params.id }).update({ irn_number, irn_generated_at: new Date(), updated_at: new Date() }).returning('*');
  return ok(res, { irn_number, invoice });
};

exports.overdue = async (req, res) => {
  const { days, customer_id } = req.query;
  let q = db('invoices as i').join('customers as c','c.id','i.customer_id').where('i.status','overdue');
  if (days)        q = q.whereRaw(`NOW() - i.due_date > INTERVAL '${parseInt(days)} days'`);
  if (customer_id) q = q.where('i.customer_id', customer_id);
  const invoices = await q.select('i.id','i.invoice_number','i.due_date','i.balance_due', db.raw("json_build_object('id',c.id,'business_name',c.business_name,'phone',c.phone) as customer")).orderBy('i.due_date','asc');
  return ok(res, { invoices });
};

exports.getRevisions = async (req, res) => {
  const revisions = await db('audit_logs').where({ table_name:'invoices', record_id: req.params.id }).orderBy('created_at','desc');
  return ok(res, { revisions });
};
