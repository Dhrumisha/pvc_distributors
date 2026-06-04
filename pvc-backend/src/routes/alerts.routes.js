// src/routes/alerts.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/alerts.controller');
router.get ('config',   auth, rbac('users','view'),   ctrl.getConfig);
router.put ('config',   auth, rbac('users','edit'),   ctrl.updateConfig);
router.post('test',     auth, rbac('users','edit'),   ctrl.test);
module.exports = router;
