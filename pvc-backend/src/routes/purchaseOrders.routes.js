// src/routes/purchaseOrders.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/purchaseOrders.controller');
const schemas = require('../validators/purchaseOrders.schema');

router.get    ('/',            auth, rbac('suppliers','view'),   ctrl.list);
router.get    ('/receipts',    auth, rbac('suppliers','view'),   ctrl.listAllReceipts); // all goods receipts (before /:id)
router.post   ('/',            auth, rbac('suppliers','create'), validate(schemas.create), audit('purchase_orders'), ctrl.create);
router.get    ('/:id',         auth, rbac('suppliers','view'),   ctrl.getOne);
router.put    ('/:id',         auth, rbac('suppliers','edit'),   validate(schemas.update), audit('purchase_orders'), ctrl.update);
router.patch  ('/:id/status',  auth, rbac('suppliers','edit'),   audit('purchase_orders'), ctrl.setStatus);
router.delete ('/:id',         auth, rbac('suppliers','delete'), audit('purchase_orders'), ctrl.remove);
router.post   ('/:id/approve', auth, rbac('suppliers','approve'),audit('purchase_orders'), ctrl.approve);
router.post   ('/:id/receive', auth, rbac('inventory','edit'),   validate(schemas.receive), audit('goods_receipts'), ctrl.receive);
router.get    ('/:id/receipts',auth, rbac('suppliers','view'),   ctrl.getReceipts);
module.exports = router;
