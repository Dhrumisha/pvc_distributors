// src/controllers/routeGroups.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, trip_date, vehicle_id } = req.query;
  const offset = (page-1)*limit;
  let q = db('route_groups as rg').leftJoin('vehicles as v','v.id','rg.vehicle_id');
  if (trip_date)  q = q.where('rg.trip_date', trip_date);
  if (vehicle_id) q = q.where('rg.vehicle_id', vehicle_id);
  const [{ count }] = await q.clone().count('rg.id as count');
  const groups = await q.clone().select('rg.*', db.raw("v.vehicle_number")).orderBy('rg.trip_date','desc').limit(limit).offset(offset);
  return paginate(res, { groups }, { page, limit, total: count });
};
exports.create = async (req, res) => {
  const [g] = await db('route_groups').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { group: g });
};
exports.getOne = async (req, res) => {
  const g = await db('route_groups').where({ id: req.params.id }).first();
  if (!g) throw new AppError('Route group not found.', 404);
  const deliveries = await db('deliveries').where({ route_group_id: g.id }).orderBy('scheduled_date');
  return ok(res, { group: g, deliveries });
};
exports.update = async (req, res) => {
  const [g] = await db('route_groups').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { group: g });
};
