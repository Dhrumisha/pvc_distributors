// src/utils/response.js
// ─────────────────────────────────────────────────────────────────────────────
// Standard response helpers used by every controller.
// Ensures every API response matches the documented envelope:
//   { success, data, message?, meta? }
// ─────────────────────────────────────────────────────────────────────────────

const ok = (res, data, message = null, meta = null, status = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  if (meta)    body.meta    = meta;
  return res.status(status).json(body);
};

const created = (res, data, message = 'Created successfully') =>
  ok(res, data, message, null, 201);

const noContent = (res) => res.status(204).send();

const paginate = (res, data, { page, limit, total }) =>
  ok(res, data, null, {
    page:       parseInt(page),
    limit:      parseInt(limit),
    total:      parseInt(total),
    totalPages: Math.ceil(total / limit),
    hasNext:    page * limit < total,
    hasPrev:    page > 1,
  });

module.exports = { ok, created, noContent, paginate };
