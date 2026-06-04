// src/routes/permissions.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/permissions.controller');
router.get('/', auth, rbac('users','view'), ctrl.list);
module.exports = router;
