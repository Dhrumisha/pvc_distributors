// src/routes/customers.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/customers.controller');
const schemas = require('../validators/customers.schema');

router.get    ('/',                              auth, rbac('customers','view'),   ctrl.list);
router.post   ('/',                              auth, rbac('customers','create'), validate(schemas.create), audit('customers'), ctrl.create);
router.get    ('/:id',                           auth, rbac('customers','view'),   ctrl.getOne);
router.put    ('/:id',                           auth, rbac('customers','edit'),   validate(schemas.update), audit('customers'), ctrl.update);
router.delete ('/:id',                           auth, rbac('customers','delete'), audit('customers'), ctrl.remove);
router.patch  ('/:id/hold',                      auth, rbac('customers','edit'),   audit('customers'), ctrl.setHold);
router.get    ('/:id/orders',                    auth, rbac('sales_orders','view'),ctrl.getOrders);
router.get    ('/:id/ledger',                    auth, rbac('payments','view'),    ctrl.getLedger);
router.get    ('/:id/statement',                 auth, rbac('payments','view'),    ctrl.getStatement);
router.get    ('/:id/outstanding',               auth, rbac('payments','view'),    ctrl.getOutstanding);
router.get    ('/:id/profitability',             auth, rbac('reports','view'),     ctrl.getProfitability);
router.get    ('/:id/credit-status',             auth, rbac('customers','view'),   ctrl.getCreditStatus);
// Addresses
router.get    ('/:id/addresses',                 auth, rbac('customers','view'),   ctrl.getAddresses);
router.post   ('/:id/addresses',                 auth, rbac('customers','edit'),   audit('customer_addresses'), ctrl.addAddress);
router.put    ('/:id/addresses/:aid',            auth, rbac('customers','edit'),   audit('customer_addresses'), ctrl.updateAddress);
router.patch  ('/:id/addresses/:aid/default',    auth, rbac('customers','edit'),   audit('customer_addresses'), ctrl.setDefaultAddress);
router.delete ('/:id/addresses/:aid',            auth, rbac('customers','edit'),   audit('customer_addresses'), ctrl.removeAddress);
module.exports = router;
