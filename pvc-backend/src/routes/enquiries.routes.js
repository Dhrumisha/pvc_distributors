// src/routes/enquiries.routes.js — admin view of website leads (auth + customers perm).
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/enquiries.controller');

router.get   ('/',              auth, rbac('customers', 'view'),   ctrl.list);
router.get   ('/unread-count',  auth, rbac('customers', 'view'),   ctrl.unreadCount);
router.get   ('/:id',           auth, rbac('customers', 'view'),   ctrl.getOne);
router.patch ('/:id/status',    auth, rbac('customers', 'edit'),   ctrl.setStatus);
router.delete('/:id',           auth, rbac('customers', 'delete'), ctrl.remove);

module.exports = router;
