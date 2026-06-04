// src/routes/routeGroups.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const audit  = require('../middleware/auditLog');
const ctrl   = require('../controllers/routeGroups.controller');
router.get    ('/',    auth, rbac('delivery','view'),   ctrl.list);
router.post   ('/',    auth, rbac('delivery','create'), audit('route_groups'), ctrl.create);
router.get    ('/:id', auth, rbac('delivery','view'),   ctrl.getOne);
router.put    ('/:id', auth, rbac('delivery','edit'),   audit('route_groups'), ctrl.update);
module.exports = router;
