// src/middleware/customerAuth.js — verifies a CUSTOMER portal JWT (kind: 'customer').
'use strict';
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/AppError');

module.exports = async function customerAuth(req, _res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) throw new AppError('Please sign in to continue.', 401);
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw new AppError('Session expired. Please sign in again.', 401); }
  if (decoded.kind !== 'customer') throw new AppError('Invalid session.', 401);
  const customer = await db('customers').where({ id: decoded.cid }).whereNull('deleted_at').first();
  if (!customer) throw new AppError('Account not found.', 401);
  req.customer = customer;
  next();
};
