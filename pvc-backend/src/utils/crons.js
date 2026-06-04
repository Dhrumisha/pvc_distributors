// src/utils/crons.js
const cron   = require('node-cron');
const db     = require('../config/db');
const logger = require('../config/logger');

async function insertNotification({ user_id, type, title, message, ref_type, ref_id }) {
  try {
    await db('notifications').insert({ user_id, type, title, message, ref_type, ref_id, channel:'in_app', is_read:0, created_at: new Date() });
  } catch (e) { logger.warn('Notification insert failed:', e.message); }
}

async function getAllAdmins() {
  return db('auth_user_roles as ur').join('auth_roles as r','r.id','ur.role_id').where('r.name','Admin').pluck('ur.user_id');
}

// ── Low stock alert ───────────────────────────────────────────────────────────
async function checkLowStock() {
  try {
    const items = await db.raw(`
      SELECT pd.id, p.name, pd.sku, p.low_stock_threshold, COALESCE(sl.total,0) as current_qty
      FROM product_dimensions pd
      JOIN products p ON p.id = pd.product_id
      LEFT JOIN (SELECT product_dimension_id, SUM(qty_change) as total FROM stock_ledger GROUP BY product_dimension_id) sl ON sl.product_dimension_id = pd.id
      WHERE COALESCE(sl.total,0) < p.low_stock_threshold AND pd.is_active = 1 AND p.deleted_at IS NULL
    `);
    const adminIds = await getAllAdmins();
    for (const item of items.rows) {
      for (const uid of adminIds) {
        await insertNotification({ user_id: uid, type:'low_stock', title:`Low stock: ${item.name}`, message:`${item.name} (${item.sku}) has ${item.current_qty} units left. Threshold: ${item.low_stock_threshold}.`, ref_type:'product_dimensions', ref_id: item.id });
      }
    }
    if (items.rows.length) logger.info(`Low stock alerts sent for ${items.rows.length} SKUs`);
  } catch (e) { logger.error('Low stock cron failed:', e.message); }
}

// ── Overdue invoices ──────────────────────────────────────────────────────────
async function checkOverdueInvoices() {
  try {
    const overdue = await db('invoices').whereIn('status',['issued','partially_paid']).where('due_date','<', new Date());
    for (const inv of overdue) {
      await db('invoices').where({ id: inv.id }).update({ status:'overdue', updated_at: new Date() });
    }
    if (overdue.length) {
      const adminIds = await getAllAdmins();
      for (const uid of adminIds) {
        await insertNotification({ user_id: uid, type:'overdue_payment', title:`${overdue.length} invoice(s) now overdue`, message:`${overdue.length} invoices have passed their due date and been marked overdue.`, ref_type:'invoices', ref_id: null });
      }
      logger.info(`Marked ${overdue.length} invoices as overdue`);
    }
  } catch (e) { logger.error('Overdue invoice cron failed:', e.message); }
}

// ── Cheque clearance reminders ────────────────────────────────────────────────
async function checkCheques() {
  try {
    const days = parseInt(process.env.CHEQUE_REMINDER_DAYS || '2');
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const cheques = await db('customer_payments as cp')
      .join('customers as c','c.id','cp.customer_id')
      .where('cp.mode','cheque')
      .where('cp.cheque_date','<=', future)
      .where('cp.cheque_date','>=', new Date())
      .select('cp.*','c.business_name');
    const adminIds = await getAllAdmins();
    for (const ch of cheques) {
      for (const uid of adminIds) {
        await insertNotification({ user_id: uid, type:'cheque_due', title:`Cheque due soon: ${ch.business_name}`, message:`Cheque ${ch.cheque_number} from ${ch.business_name} for ₹${ch.amount} is due on ${ch.cheque_date}.`, ref_type:'customer_payments', ref_id: ch.id });
      }
    }
    if (cheques.length) logger.info(`Cheque reminders sent for ${cheques.length} cheques`);
  } catch (e) { logger.error('Cheque cron failed:', e.message); }
}

function init() {
  const schedule = process.env.ALERT_CRON_SCHEDULE || '0 8 * * *';
  cron.schedule(schedule, async () => {
    // Top-level guard: a throw here must never reach process 'uncaughtException'
    // (which would exit the API). Each sub-job also has its own try/catch.
    try {
      logger.info('Running scheduled alerts...');
      await checkLowStock();
      await checkOverdueInvoices();
      await checkCheques();
    } catch (e) {
      logger.error('Scheduled alerts run failed (non-fatal):', e.message);
    }
  });
  logger.info(`Cron jobs scheduled: ${schedule}`);
}

module.exports = { init, checkLowStock, checkOverdueInvoices, checkCheques };
