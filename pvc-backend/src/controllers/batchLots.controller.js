// src/controllers/batchLots.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');
exports.list = async (req, res) => {
  const { page=1, limit=20, supplier_id } = req.query;
  const offset = (page-1)*limit;
  let q = db('batch_lots as bl').leftJoin('suppliers as s','s.id','bl.supplier_id');
  if (supplier_id) q = q.where('bl.supplier_id', supplier_id);
  const [{ count }] = await q.clone().count('bl.id as count');
  const lots = await q.clone().select('bl.*', db.raw("s.name as supplier_name")).orderBy('bl.received_date','desc').limit(limit).offset(offset);
  return paginate(res, { lots }, { page, limit, total: count });
};
exports.create = async (req, res) => {
  const [lot] = await db('batch_lots').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date() }).returning('*');
  return created(res, { lot });
};
exports.getOne = async (req, res) => {
  const lot = await db('batch_lots').where({ id: req.params.id }).first();
  if (!lot) throw new AppError('Batch lot not found.', 404);
  const movements = await db('stock_ledger').where({ batch_lot_id: lot.id }).orderBy('created_at','desc');
  return ok(res, { lot, movements });
};
