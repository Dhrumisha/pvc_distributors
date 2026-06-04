// src/validators/auth.schema.js
const Joi = require('joi');

const password = Joi.string().min(8).max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be at least 8 characters with uppercase, lowercase, and a number.');

module.exports = {
  login: Joi.object({
    email:    Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required(),
  }),
  forgotPassword: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
  }),
  resetPassword: Joi.object({
    token:        Joi.string().required(),
    new_password: password.required(),
  }),
  setPassword: Joi.object({
    token:    Joi.string().allow('', null).optional(), // optional — empty when session-based
    password: password.required(),
  }),
  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password:     password.required(),
  }),
  updateMe: Joi.object({
    name:       Joi.string().trim().min(2).max(100),
    phone:      Joi.string().trim().max(20).allow('', null),
    avatar_url: Joi.string().uri().max(500).allow('', null),
  }),
};
