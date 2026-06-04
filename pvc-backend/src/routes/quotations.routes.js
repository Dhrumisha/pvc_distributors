// src/routes/quotations.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/quotations.controller');
const schemas = require('../validators/quotations.schema');
router.get    ('/',             auth, rbac('sales_orders','view'),   ctrl.list);
router.post   ('/',             auth, rbac('sales_orders','create'), validate(schemas.create), audit('quotations'), ctrl.create);
router.get    ('/:id',          auth, rbac('sales_orders','view'),   ctrl.getOne);
router.put    ('/:id',          auth, rbac('sales_orders','edit'),   validate(schemas.update), audit('quotations'), ctrl.update);
router.patch  ('/:id/status',   auth, rbac('sales_orders','edit'),   audit('quotations'), ctrl.setStatus);
router.post   ('/:id/convert',  auth, rbac('sales_orders','create'), audit('sales_orders'), ctrl.convert);
router.get    ('/:id/pdf',      auth, rbac('sales_orders','view'),   ctrl.getPdf);
router.post   ('/:id/share',    auth, rbac('sales_orders','view'),   ctrl.share);
module.exports = router;
