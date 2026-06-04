// src/routes/suppliers.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/suppliers.controller');
const schemas = require('../validators/suppliers.schema');

router.get    ('/',                       auth, rbac('suppliers','view'),   ctrl.list);
router.post   ('/',                       auth, rbac('suppliers','create'), validate(schemas.create), audit('suppliers'), ctrl.create);
router.get    ('/:id',                    auth, rbac('suppliers','view'),   ctrl.getOne);
router.put    ('/:id',                    auth, rbac('suppliers','edit'),   validate(schemas.update), audit('suppliers'), ctrl.update);
router.delete ('/:id',                    auth, rbac('suppliers','delete'), audit('suppliers'), ctrl.remove);
router.get    ('/:id/products',           auth, rbac('suppliers','view'),   ctrl.getProducts);
router.post   ('/:id/products',           auth, rbac('suppliers','edit'),   audit('supplier_products'), ctrl.addProduct);
router.delete ('/:id/products/:pdid',     auth, rbac('suppliers','edit'),   audit('supplier_products'), ctrl.removeProduct);
router.get    ('/:id/price-history',      auth, rbac('suppliers','view'),   ctrl.priceHistory);
router.post   ('/:id/price-history',      auth, rbac('suppliers','edit'),   audit('supplier_price_history'), ctrl.addPrice);
router.get    ('/:id/purchase-orders',    auth, rbac('suppliers','view'),   ctrl.getPurchaseOrders);
router.get    ('/:id/outstanding',        auth, rbac('payments','view'),    ctrl.outstanding);
module.exports = router;
