// src/routes/notifications.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/notifications.controller');
router.get    ('/',              auth, ctrl.list);
router.get    ('/unread-count',  auth, ctrl.unreadCount);
router.patch  ('/:id/read',      auth, ctrl.markRead);
router.post   ('/read-all',      auth, ctrl.markAllRead);
router.delete ('/:id',           auth, ctrl.remove);
module.exports = router;
