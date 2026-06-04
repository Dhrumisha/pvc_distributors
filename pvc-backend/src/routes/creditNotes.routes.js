// src/routes/creditNotes.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/creditNotes.controller');
const schemas = require('../validators/creditNotes.schema');
router.get    ('/',           auth, rbac('invoices','view'),   ctrl.list);
router.post   ('/',           auth, rbac('invoices','create'), validate(schemas.create), audit('credit_notes'), ctrl.create);
router.get    ('/:id',        auth, rbac('invoices','view'),   ctrl.getOne);
router.patch  ('/:id/issue',  auth, rbac('invoices','edit'),   audit('credit_notes'), ctrl.issue);
router.patch  ('/:id/apply',  auth, rbac('invoices','edit'),   audit('credit_notes'), ctrl.apply);
router.get    ('/:id/pdf',    auth, rbac('invoices','view'),   ctrl.getPdf);
module.exports = router;
