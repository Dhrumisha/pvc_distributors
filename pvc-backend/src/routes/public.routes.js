// src/routes/public.routes.js — PUBLIC (no auth) endpoints for the marketing website.
const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl      = require('../controllers/public.controller');

// Light limiter for the public enquiry form (anti-spam)
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

router.get ('/categories',     ctrl.categories);
router.get ('/products',       ctrl.products);
router.get ('/products/:id',   ctrl.product);
router.post('/enquiries',      enquiryLimiter, ctrl.createEnquiry);

module.exports = router;
