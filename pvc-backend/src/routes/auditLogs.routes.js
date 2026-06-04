// src/routes/auditLogs.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/auditLogs.controller');
router.get('/export', auth, rbac('users','view'), ctrl.export);
router.get('/',       auth, rbac('users','view'), ctrl.list);
router.get('/:id',    auth, rbac('users','view'), ctrl.getOne);
module.exports = router;
