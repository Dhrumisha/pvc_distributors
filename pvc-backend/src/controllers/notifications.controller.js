// src/controllers/notifications.controller.js
const db = require('../config/db');
const { ok, noContent, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  const { page=1, limit=20, is_read, type } = req.query;
  const offset = (page-1)*limit;
  let q = db('notifications').where({ user_id: req.user.id });
  if (is_read !== undefined) q = q.where('is_read', is_read);
  if (type) q = q.where('type', type);
  const [{ count }] = await q.clone().count('id as count');
  const [{ unread }] = await db('notifications').where({ user_id: req.user.id, is_read: 0 }).count('id as unread');
  const notifications = await q.clone().orderBy('created_at','desc').limit(limit).offset(offset);
  return paginate(res, { notifications, unread_count: parseInt(unread) }, { page, limit, total: count });
};

exports.unreadCount = async (req, res) => {
  const [{ count }] = await db('notifications').where({ user_id: req.user.id, is_read: 0 }).count('id as count');
  return ok(res, { count: parseInt(count) });
};

exports.markRead = async (req, res) => {
  const [n] = await db('notifications').where({ id: req.params.id, user_id: req.user.id }).update({ is_read: 1, read_at: new Date() }).returning('*');
  return ok(res, { notification: n });
};

exports.markAllRead = async (req, res) => {
  const count = await db('notifications').where({ user_id: req.user.id, is_read: 0 }).update({ is_read: 1, read_at: new Date() });
  return ok(res, { count }, `${count} notifications marked as read.`);
};

exports.remove = async (req, res) => {
  await db('notifications').where({ id: req.params.id, user_id: req.user.id }).delete();
  return noContent(res);
};
