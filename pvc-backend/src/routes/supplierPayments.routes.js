// src/routes/supplierPayments.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/supplierPayments.controller');
const schemas = require('../validators/payments.schema');
router.get  ('/outstanding', auth, rbac('payments','view'), ctrl.outstanding);
router.get  ('/',            auth, rbac('payments','view'), ctrl.list);
router.post ('/',            auth, rbac('payments','create'), validate(schemas.supplierPayment), audit('supplier_payments'), ctrl.create);
router.get  ('/:id',         auth, rbac('payments','view'), ctrl.getOne);
module.exports = router;
