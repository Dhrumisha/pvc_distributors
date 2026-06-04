// src/controllers/categories.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=50, search } = req.query;
  const offset = (page-1)*limit;
  let q = db('categories');
  if (search) q = q.whereILike('name',`%${search}%`);
  const [{ count }] = await q.clone().count('id as count');
  const categories = await q.clone().orderBy('name').limit(limit).offset(offset);
  return paginate(res, { categories }, { page, limit, total: count });
};
exports.create = async (req, res) => {
  const [cat] = await db('categories').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { category: cat });
};
exports.getOne = async (req, res) => {
  const cat = await db('categories').where({ id: req.params.id }).first();
  if (!cat) throw new AppError('Category not found.', 404);
  return ok(res, { category: cat });
};
exports.update = async (req, res) => {
  const [cat] = await db('categories').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { category: cat });
};
exports.remove = async (req, res) => {
  await db('categories').where({ id: req.params.id }).delete();
  return noContent(res);
};
