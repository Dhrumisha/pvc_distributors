// src/routes/users.routes.js
const router   = require('express').Router();
const auth     = require('../middleware/auth');
const rbac     = require('../middleware/rbac');
const validate = require('../middleware/validate');
const audit    = require('../middleware/auditLog');
const ctrl     = require('../controllers/users.controller');
const schemas  = require('../validators/users.schema');

router.get    ('/',                  auth, rbac('users','view'),   ctrl.list);
router.post   ('/',                  auth, rbac('users','create'), validate(schemas.create), audit('users'), ctrl.create);
router.get    ('/:id',               auth, rbac('users','view'),   ctrl.getOne);
router.put    ('/:id',               auth, rbac('users','edit'),   validate(schemas.update), audit('users'), ctrl.update);
router.patch  ('/:id/status',        auth, rbac('users','edit'),   audit('users'), ctrl.setStatus);
router.delete ('/:id',               auth, rbac('users','delete'), audit('users'), ctrl.remove);
router.post   ('/:id/roles',         auth, rbac('users','edit'),   audit('users'), ctrl.assignRoles);
router.delete ('/:id/roles/:roleId', auth, rbac('users','edit'),   audit('users'), ctrl.removeRole);
router.post   ('/:id/resend-invite', auth, rbac('users','edit'),   ctrl.resendInvite); // resend set-password email

module.exports = router;
