// src/validators/salesOrders.schema.js
const Joi = require('joi');
const item = Joi.object({
  product_dimension_id: Joi.number().integer().required(),
  qty:          Joi.number().positive().required(),
  unit_price:   Joi.number().min(0).required(),
  gst_rate:     Joi.number().min(0).max(100).default(0),
  discount_pct: Joi.number().min(0).max(100).default(0),
});
module.exports = {
  create: Joi.object({
    customer_id:         Joi.number().integer().required(),
    delivery_type:       Joi.string().valid('our_vehicle','customer_vehicle').required(),
    delivery_address_id: Joi.number().integer().allow(null),
    required_date:       Joi.date().iso().allow(null),
    quotation_id:        Joi.number().integer().allow(null),
    notes:               Joi.string().allow('',null),
    items:               Joi.array().items(item).min(1).required(),
  }),
  update: Joi.object({
    delivery_type:       Joi.string().valid('our_vehicle','customer_vehicle'),
    delivery_address_id: Joi.number().integer().allow(null),
    required_date:       Joi.date().iso().allow(null),
    notes:               Joi.string().allow('',null),
    _reason:             Joi.string().allow('',null),
  }),
};
