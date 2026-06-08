// src/routes/portal.routes.js — customer portal (website) API.
const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const customerAuth = require('../middleware/customerAuth');
const ctrl      = require('../controllers/portal.controller');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many attempts. Try again later.' } });

// Public (no customer token)
router.post('/register', authLimiter, ctrl.register);
router.post('/login',    authLimiter, ctrl.login);

// Authenticated customer
router.get ('/me',            customerAuth, ctrl.me);
router.get ('/products',      customerAuth, ctrl.products);
router.get ('/products/:id',  customerAuth, ctrl.product);
router.get ('/orders',        customerAuth, ctrl.orders);
router.get ('/orders/:id',    customerAuth, ctrl.order);
router.post('/orders',        customerAuth, ctrl.placeOrder);
router.get ('/outstanding',   customerAuth, ctrl.outstanding);
router.post('/payments',      customerAuth, ctrl.pay);

module.exports = router;
