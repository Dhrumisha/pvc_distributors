// src/routes/modules.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/modules.controller');

router.get('/',            auth, rbac('users','view'), ctrl.list);
router.get('/:id/actions', auth, rbac('users','view'), ctrl.getActions);
module.exports = router;
