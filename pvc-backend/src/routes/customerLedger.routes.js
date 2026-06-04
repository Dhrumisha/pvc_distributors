// src/routes/customerLedger.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/customerLedger.controller');
router.get('/:customerId',         auth, rbac('payments','view'), ctrl.get);
router.get('/:customerId/summary', auth, rbac('payments','view'), ctrl.summary);
module.exports = router;
