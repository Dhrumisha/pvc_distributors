// src/controllers/vehicles.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');
exports.list = async (req, res) => {
  const { page=1, limit=20, search, is_active } = req.query;
  const offset = (page-1)*limit;
  let q = db('vehicles');
  if (search)    q = q.whereILike('vehicle_number',`%${search}%`);
  if (is_active !== undefined) q = q.where('is_active', is_active);
  const [{ count }] = await q.clone().count('id as count');
  const vehicles = await q.clone().orderBy('vehicle_number').limit(limit).offset(offset);
  return paginate(res, { vehicles }, { page, limit, total: count });
};
exports.create = async (req, res) => {
  const [v] = await db('vehicles').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { vehicle: v });
};
exports.getOne = async (req, res) => {
  const v = await db('vehicles').where({ id: req.params.id }).first();
  if (!v) throw new AppError('Vehicle not found.', 404);
  const deliveries = await db('deliveries').where({ vehicle_id: v.id }).orderBy('scheduled_date','desc').limit(10);
  return ok(res, { vehicle: v, deliveries });
};
exports.update = async (req, res) => {
  const [v] = await db('vehicles').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { vehicle: v });
};
exports.setStatus = async (req, res) => {
  const [v] = await db('vehicles').where({ id: req.params.id }).update({ is_active: req.body.is_active, updated_at: new Date() }).returning('*');
  return ok(res, { vehicle: v });
};
