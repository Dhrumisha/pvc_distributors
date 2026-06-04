// src/controllers/priceLists.controller.js
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, created, noContent, paginate } = require('../utils/response');

exports.list = async (_req, res) => {
  const lists = await db('price_lists').where({ is_active:1 }).orderBy('name');
  return ok(res, { price_lists: lists });
};
exports.create = async (req, res) => {
  const [pl] = await db('price_lists').insert({ ...req.body, ip_address: req.ip, created_by: req.user.id, created_at: new Date(), updated_at: new Date() }).returning('*');
  return created(res, { price_list: pl });
};
exports.getOne = async (req, res) => {
  const pl = await db('price_lists').where({ id: req.params.id }).first();
  if (!pl) throw new AppError('Price list not found.', 404);
  const items = await db('price_list_items as pli').join('product_dimensions as pd','pd.id','pli.product_dimension_id').join('products as p','p.id','pd.product_id').where('pli.price_list_id', pl.id).select('pli.*','p.name','pd.sku');
  return ok(res, { price_list: pl, items });
};
exports.update = async (req, res) => {
  const [pl] = await db('price_lists').where({ id: req.params.id }).update({ ...req.body, updated_by: req.user.id, updated_at: new Date() }).returning('*');
  return ok(res, { price_list: pl });
};
exports.remove = async (req, res) => {
  await db('price_lists').where({ id: req.params.id }).update({ is_active:0 });
  return noContent(res);
};
exports.getItems = async (req, res) => {
  const { page=1, limit=50, search } = req.query;
  const offset = (page-1)*limit;
  let q = db('price_list_items as pli').join('product_dimensions as pd','pd.id','pli.product_dimension_id').join('products as p','p.id','pd.product_id').where('pli.price_list_id', req.params.id);
  if (search) q = q.whereILike('p.name',`%${search}%`);
  const [{ count }] = await q.clone().count('pli.id as count');
  const items = await q.clone().select('pli.*','p.name','pd.sku','pd.dimension_label').orderBy('p.name').limit(limit).offset(offset);
  return paginate(res, { items }, { page, limit, total: count });
};
exports.addItem = async (req, res) => {
  const [item] = await db('price_list_items').insert({ ...req.body, price_list_id: req.params.id, created_at: new Date() }).onConflict(['price_list_id','product_dimension_id']).merge().returning('*');
  return created(res, { item });
};
exports.updateItem = async (req, res) => {
  const [item] = await db('price_list_items').where({ id: req.params.iid, price_list_id: req.params.id }).update({ ...req.body, updated_at: new Date() }).returning('*');
  return ok(res, { item });
};
exports.removeItem = async (req, res) => {
  await db('price_list_items').where({ id: req.params.iid }).delete();
  return noContent(res);
};
exports.bulkImport = async (req, res) => {
  const { items=[] } = req.body;
  let imported=0, errors=[];
  for (const item of items) {
    try {
      const dim = await db('product_dimensions').where({ sku: item.sku }).first();
      if (!dim) { errors.push({ sku: item.sku, error:'SKU not found' }); continue; }
      await db('price_list_items').insert({ price_list_id: req.params.id, product_dimension_id: dim.id, selling_price: item.selling_price, created_at: new Date() }).onConflict(['price_list_id','product_dimension_id']).merge({ selling_price: item.selling_price });
      imported++;
    } catch(e) { errors.push({ sku: item.sku, error: e.message }); }
  }
  return ok(res, { imported, errors }, `${imported} items imported.`);
};
