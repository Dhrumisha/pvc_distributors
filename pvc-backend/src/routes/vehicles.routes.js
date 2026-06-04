// src/routes/vehicles.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const audit  = require('../middleware/auditLog');
const ctrl   = require('../controllers/vehicles.controller');
router.get    ('/',            auth, rbac('delivery','view'),   ctrl.list);
router.post   ('/',            auth, rbac('delivery','create'), audit('vehicles'), ctrl.create);
router.get    ('/:id',         auth, rbac('delivery','view'),   ctrl.getOne);
router.put    ('/:id',         auth, rbac('delivery','edit'),   audit('vehicles'), ctrl.update);
router.patch  ('/:id/status',  auth, rbac('delivery','edit'),   audit('vehicles'), ctrl.setStatus);
module.exports = router;
