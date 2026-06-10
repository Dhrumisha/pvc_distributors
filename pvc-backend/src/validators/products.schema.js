// src/validators/products.schema.js
const Joi = require('joi');
module.exports = {
  create: Joi.object({
    name:                 Joi.string().trim().min(1).max(200).required(),
    category_id:          Joi.number().integer().required(),
    unit:                 Joi.string().valid('piece','sheet','meter','kg','bundle').default('piece'),
    hsn_code:             Joi.string().max(20).allow('',null),
    gst_rate:             Joi.number().min(0).max(100).default(0),
    low_stock_threshold:  Joi.number().min(0).default(10),
    description:          Joi.string().allow('',null),
    default_supplier_id:  Joi.number().integer().allow(null),
    image_url:            Joi.string().max(500).allow('',null),
    badge:                Joi.string().max(40).allow('',null),
  }),
  update: Joi.object({
    name:                Joi.string().trim().min(1).max(200),
    gst_rate:            Joi.number().min(0).max(100),
    low_stock_threshold: Joi.number().min(0),
    description:         Joi.string().allow('',null),
    is_active:           Joi.number().valid(0,1),
    default_supplier_id: Joi.number().integer().allow(null),
    image_url:           Joi.string().max(500).allow('',null),
    badge:               Joi.string().max(40).allow('',null),
  }),
  dimension: Joi.object({
    sku:             Joi.string().trim().max(50).required(),
    dimension_label: Joi.string().max(80).required(),
    purchase_price:  Joi.number().min(0).required(),
    selling_price:   Joi.number().min(0).required(),
    width_mm:        Joi.number().allow(null),
    height_mm:       Joi.number().allow(null),
    thickness_mm:    Joi.number().allow(null),
    color:           Joi.string().max(60).allow('',null),
  }),
  dimensionUpdate: Joi.object({
    purchase_price: Joi.number().min(0),
    selling_price:  Joi.number().min(0),
    is_active:      Joi.number().valid(0,1),
    color:          Joi.string().max(60).allow('',null),
  }),
};
