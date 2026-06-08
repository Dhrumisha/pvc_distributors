// src/controllers/portalAdmin.controller.js — admin controls for the customer portal.
'use strict';
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { ok } = require('../utils/response');

// GET /portal-admin/type-discounts
exports.getTypeDiscounts = async (_req, res) => {
  const rows = await db('customer_type_discounts').orderBy('customer_type');
  return ok(res, { type_discounts: rows });
};

// PUT /portal-admin/type-discounts  body: { items: [{customer_type, label, discount_percent, credit_allowed}] }
exports.updateTypeDiscounts = async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) throw new AppError('items array required.', 400);
  for (const it of items) {
    if (!it.customer_type) continue;
    await db('customer_type_discounts')
      .insert({
        customer_type: it.customer_type, label: it.label || it.customer_type,
        discount_percent: Number(it.discount_percent) || 0, credit_allowed: !!it.credit_allowed,
        created_at: new Date(), updated_at: new Date(),
      })
      .onConflict('customer_type')
      .merge({ label: it.label || it.customer_type, discount_percent: Number(it.discount_percent) || 0, credit_allowed: !!it.credit_allowed, updated_at: new Date() });
  }
  const rows = await db('customer_type_discounts').orderBy('customer_type');
  return ok(res, { type_discounts: rows }, 'Saved.');
};

// GET /portal-admin/pending — customers awaiting portal approval
exports.pending = async (_req, res) => {
  const rows = await db('customers').where({ portal_status: 'pending' }).whereNull('deleted_at')
    .select('id', 'business_name', 'contact_person', 'email', 'phone', 'customer_type', 'created_at')
    .orderBy('created_at', 'desc');
  return ok(res, { customers: rows });
};

// PATCH /portal-admin/customers/:id — set portal/credit/discount fields
exports.updateCustomer = async (req, res) => {
  const { customer_type, discount_percent, credit_limit, credit_days, portal_status } = req.body || {};
  const patch = { updated_at: new Date() };
  if (customer_type !== undefined)   patch.customer_type = customer_type;
  if (discount_percent !== undefined) patch.discount_percent = discount_percent === null || discount_percent === '' ? null : Number(discount_percent);
  if (credit_limit !== undefined)    patch.credit_limit = Number(credit_limit) || 0;
  if (credit_days !== undefined)     patch.credit_days = Number(credit_days) || 0;
  if (portal_status !== undefined)   patch.portal_status = portal_status;
  const [c] = await db('customers').where({ id: req.params.id }).update(patch).returning('*');
  if (!c) throw new AppError('Customer not found.', 404);
  return ok(res, { customer: c }, 'Customer updated.');
};

// POST /portal-admin/customers/:id/approve
exports.approve = async (req, res) => {
  const { customer_type, discount_percent, credit_limit, credit_days } = req.body || {};
  const patch = { portal_status: 'approved', updated_at: new Date() };
  if (customer_type)                  patch.customer_type = customer_type;
  if (discount_percent !== undefined && discount_percent !== '') patch.discount_percent = Number(discount_percent);
  if (credit_limit !== undefined)     patch.credit_limit = Number(credit_limit) || 0;
  if (credit_days !== undefined)      patch.credit_days = Number(credit_days) || 0;
  const [c] = await db('customers').where({ id: req.params.id }).update(patch).returning('*');
  if (!c) throw new AppError('Customer not found.', 404);
  return ok(res, { customer: c }, 'Customer approved for portal access.');
};
