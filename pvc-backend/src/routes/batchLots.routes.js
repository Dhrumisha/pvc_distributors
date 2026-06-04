// src/routes/batchLots.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const audit  = require('../middleware/auditLog');
const ctrl   = require('../controllers/batchLots.controller');
router.get  ('/',    auth, rbac('inventory','view'),   ctrl.list);
router.post ('/',    auth, rbac('inventory','create'), audit('batch_lots'), ctrl.create);
router.get  ('/:id', auth, rbac('inventory','view'),   ctrl.getOne);
module.exports = router;
