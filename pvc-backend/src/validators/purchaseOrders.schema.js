// src/validators/purchaseOrders.schema.js
const Joi = require('joi');

// Base schema shared between create and update
const base = Joi.object({
  name: Joi.string().trim().min(1).max(200),
}).unknown(true); // Allow extra fields — tighten per module as needed

module.exports = {
  create: base,
  update: base,
  base,
};
