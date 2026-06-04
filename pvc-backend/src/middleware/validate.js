// src/middleware/validate.js
// ─────────────────────────────────────────────────────────────────────────────
// Joi validation middleware factory.
// Usage: router.post('/', auth, validate(schema), controller)
// Validates req.body by default; pass { query: true } for query params.
// ─────────────────────────────────────────────────────────────────────────────
const AppError = require('../utils/AppError');

const validate = (schema, { query = false } = {}) => (req, _res, next) => {
  const target = query ? req.query : req.body;
  const { error, value } = schema.validate(target, {
    abortEarly:   false,
    stripUnknown: true,
    allowUnknown: false,
  });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      msg:   d.message.replace(/['"]/g, ''),
    }));
    return next(Object.assign(
      new AppError('Validation failed', 400),
      { errors }
    ));
  }

  // Replace body/query with stripped+coerced values
  if (query) req.query = value;
  else       req.body  = value;
  next();
};

module.exports = validate;
