// src/routes/purchaseInvoices.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/purchaseInvoices.controller');
const schemas = require('../validators/purchaseInvoices.schema');
router.get    ('/',            auth, rbac('invoices','view'),   ctrl.list);
router.post   ('/',            auth, rbac('invoices','create'), validate(schemas.create), audit('purchase_invoices'), ctrl.create);
router.get    ('/:id',         auth, rbac('invoices','view'),   ctrl.getOne);
router.put    ('/:id',         auth, rbac('invoices','edit'),   validate(schemas.update), audit('purchase_invoices'), ctrl.update);
router.patch  ('/:id/status',  auth, rbac('invoices','edit'),   audit('purchase_invoices'), ctrl.setStatus);
module.exports = router;
