// src/utils/crudRouter.js
// ─────────────────────────────────────────────────────────────────────────────
// Factory that generates a standard CRUD router for any resource.
// Cuts boilerplate — each module just calls crudRouter(config).
//
// Usage:
//   module.exports = crudRouter({
//     module:     'categories',        // permission module code
//     controller: require('../controllers/categories.controller'),
//     schemas:    require('../validators/categories.schema'),
//     auditName:  'categories',        // audit_logs table_name value
//   });
// ─────────────────────────────────────────────────────────────────────────────
const router   = require('express').Router();
const auth     = require('../middleware/auth');
const rbac     = require('../middleware/rbac');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLog');

function crudRouter({ module: mod, controller: ctrl, schemas, auditName, extraRoutes }) {
  const r = require('express').Router();

  // Allow caller to inject extra routes before standard CRUD
  if (typeof extraRoutes === 'function') extraRoutes(r, { auth, rbac, validate, auditLog });

  r.get    ('/',    auth, rbac(mod, 'view'),   ctrl.list);
  r.post   ('/',    auth, rbac(mod, 'create'), validate(schemas?.create || schemas?.base), auditLog(auditName || mod), ctrl.create);
  r.get    ('/:id', auth, rbac(mod, 'view'),   ctrl.getOne);
  r.put    ('/:id', auth, rbac(mod, 'edit'),   validate(schemas?.update || schemas?.base), auditLog(auditName || mod), ctrl.update);
  r.delete ('/:id', auth, rbac(mod, 'delete'), auditLog(auditName || mod), ctrl.remove);

  return r;
}

module.exports = crudRouter;
