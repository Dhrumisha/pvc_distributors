// src/routes/stock.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/stock.controller');

router.get  ('/reservations', auth, rbac('inventory','view'),   ctrl.reservations);
router.get  ('/',             auth, rbac('inventory','view'),   ctrl.list);
router.get  ('/:dimensionId', auth, rbac('inventory','view'),   ctrl.getOne);
router.post ('/opening',      auth, rbac('inventory','create'), audit('stock_ledger'), ctrl.openingBulk);
router.post ('/adjustment',   auth, rbac('inventory','edit'),   audit('stock_ledger'), ctrl.adjustment);
router.post ('/damage',       auth, rbac('inventory','edit'),   audit('stock_ledger'), ctrl.damage);
module.exports = router;
