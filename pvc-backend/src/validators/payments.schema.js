// src/validators/payments.schema.js
const Joi = require('joi');
const mode = Joi.string().valid('cash','neft','rtgs','cheque','upi','other');
module.exports = {
  customerPayment: Joi.object({
    invoice_id:       Joi.number().integer().required(),
    customer_id:      Joi.number().integer().required(),
    payment_date:     Joi.date().iso().required(),
    amount:           Joi.number().positive().required(),
    mode:             mode.required(),
    reference_number: Joi.string().max(100).allow('',null),
    cheque_number:    Joi.string().max(50).allow('',null),
    cheque_bank:      Joi.string().max(100).allow('',null),
    cheque_date:      Joi.date().iso().allow(null),
    tds_amount:       Joi.number().min(0).default(0),
    notes:            Joi.string().allow('',null),
  }),
  supplierPayment: Joi.object({
    purchase_invoice_id: Joi.number().integer().required(),
    supplier_id:         Joi.number().integer().required(),
    payment_date:        Joi.date().iso().required(),
    amount:              Joi.number().positive().required(),
    mode:                mode.default('neft'),
    reference_number:    Joi.string().max(100).allow('',null),
    notes:               Joi.string().allow('',null),
  }),
};
