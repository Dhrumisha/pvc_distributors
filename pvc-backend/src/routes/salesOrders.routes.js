// src/routes/salesOrders.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/salesOrders.controller');
const schemas = require('../validators/salesOrders.schema');

router.get    ('/templates',              auth, rbac('sales_orders','view'),   ctrl.getTemplates);
router.post   ('/from-template/:id',      auth, rbac('sales_orders','create'), audit('sales_orders'), ctrl.fromTemplate);
router.get    ('/',                       auth, rbac('sales_orders','view'),   ctrl.list);
router.post   ('/',                       auth, rbac('sales_orders','create'), validate(schemas.create), audit('sales_orders'), ctrl.create);
router.get    ('/:id',                    auth, rbac('sales_orders','view'),   ctrl.getOne);
router.put    ('/:id',                    auth, rbac('sales_orders','edit'),   validate(schemas.update), audit('sales_orders'), ctrl.update);
router.patch  ('/:id/confirm',            auth, rbac('sales_orders','edit'),   audit('sales_orders'), ctrl.confirm);
router.patch  ('/:id/cancel',             auth, rbac('sales_orders','edit'),   audit('sales_orders'), ctrl.cancel);
router.post   ('/:id/approve',            auth, rbac('sales_orders','approve'),audit('sales_orders'), ctrl.approve);
router.get    ('/:id/amendments',         auth, rbac('sales_orders','view'),   ctrl.getAmendments);
router.get    ('/:id/stock-check',        auth, rbac('sales_orders','view'),   ctrl.stockCheck);
router.post   ('/:id/save-template',      auth, rbac('sales_orders','edit'),   audit('sales_orders'), ctrl.saveTemplate);
module.exports = router;
