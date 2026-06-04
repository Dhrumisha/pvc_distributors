// src/routes/roles.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/roles.controller');

router.get    ('/',                      auth, rbac('users','view'),   ctrl.list);
router.post   ('/',                      auth, rbac('users','create'), audit('roles'), ctrl.create);
router.get    ('/matrix',                auth, rbac('users','view'),   ctrl.matrix);
router.get    ('/:id',                   auth, rbac('users','view'),   ctrl.getOne);
router.put    ('/:id',                   auth, rbac('users','edit'),   audit('roles'), ctrl.update);
router.delete ('/:id',                   auth, rbac('users','delete'), audit('roles'), ctrl.remove);
router.get    ('/:id/permissions',       auth, rbac('users','view'),   ctrl.getPermissions);
router.post   ('/:id/permissions',       auth, rbac('users','edit'),   audit('roles'), ctrl.addPermissions);
router.delete ('/:id/permissions/:pid',  auth, rbac('users','edit'),   audit('roles'), ctrl.removePermission);
module.exports = router;
