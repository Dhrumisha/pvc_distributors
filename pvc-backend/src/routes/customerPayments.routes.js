// src/routes/customerPayments.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/customerPayments.controller');
const schemas = require('../validators/payments.schema');

router.get  ('/cheques-due', auth, rbac('payments','view'), ctrl.chequesDue);
router.get  ('/aging',       auth, rbac('payments','view'), ctrl.aging);
router.get  ('/',            auth, rbac('payments','view'), ctrl.list);
router.post ('/',            auth, rbac('payments','create'), validate(schemas.customerPayment), audit('customer_payments'), ctrl.create);
router.get  ('/:id',         auth, rbac('payments','view'), ctrl.getOne);
router.post ('/:id/reminder',auth, rbac('payments','edit'), audit('customer_payments'), ctrl.logReminder);
module.exports = router;
