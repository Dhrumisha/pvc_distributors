// src/controllers/enquiries.controller.js — admin view of website leads.
'use strict';
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok, paginate, noContent } = require('../utils/response');

exports.list = async (req, res) => {
  const { page = 1, limit = 20, status, type, search } = req.query;
  const offset = (page - 1) * limit;
  let q = db('enquiries');
  if (status) q = q.where('status', status);
  if (type)   q = q.where('type', type);
  if (search) q = q.where(b => b.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`).orWhereILike('phone', `%${search}%`));
  const [{ count }] = await q.clone().count('id as count');
  const enquiries = await q.clone().orderBy('created_at', 'desc').limit(limit).offset(offset);
  return paginate(res, { enquiries }, { page, limit, total: count });
};

exports.getOne = async (req, res) => {
  const enquiry = await db('enquiries').where({ id: req.params.id }).first();
  if (!enquiry) throw new AppError('Enquiry not found.', 404);
  return ok(res, { enquiry });
};

exports.setStatus = async (req, res) => {
  const { status } = req.body;
  const [row] = await db('enquiries').where({ id: req.params.id })
    .update({ status, updated_at: new Date() })
    .returning('*');
  if (!row) throw new AppError('Enquiry not found.', 404);
  return ok(res, { enquiry: row }, 'Status updated.');
};

exports.remove = async (req, res) => {
  await db('enquiries').where({ id: req.params.id }).delete();
  return noContent(res);
};

exports.unreadCount = async (_req, res) => {
  const [{ count }] = await db('enquiries').where('status', 'new').count('id as count');
  return ok(res, { count: parseInt(count) });
};
