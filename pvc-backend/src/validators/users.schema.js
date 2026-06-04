// src/validators/users.schema.js
const Joi = require('joi');

module.exports = {
  // Invite flow: admin provides name/email/phone/roles only. The invited user
  // sets their own password via the emailed set-password link, so no password
  // is accepted (or required) here.
  create: Joi.object({
    name:     Joi.string().trim().min(2).max(100).required(),
    email:    Joi.string().email().lowercase().trim().required(),
    phone:    Joi.string().max(20).allow('',null),
    role_ids: Joi.array().items(Joi.number().integer()).default([]),
  }),
  update: Joi.object({
    name:      Joi.string().trim().min(2).max(100),
    phone:     Joi.string().max(20).allow('',null),
    is_active: Joi.number().valid(0,1),
    avatar_url:Joi.string().uri().allow('',null),
  }),
};
