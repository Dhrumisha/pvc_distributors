// src/routes/dashboard.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/dashboard.controller');
router.get('/summary',           auth, ctrl.summary);
router.get('/activity',          auth, ctrl.activity);
router.get('/low-stock',         auth, ctrl.lowStock);
router.get('/overdue-payments',  auth, ctrl.overduePayments);
router.get('/pending-deliveries',auth, ctrl.pendingDeliveries);
router.get('/revenue-chart',     auth, ctrl.revenueChart);
module.exports = router;
