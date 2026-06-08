// src/routes/portalAdmin.routes.js — admin controls for the customer portal.
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/portalAdmin.controller');

router.get  ('/type-discounts',          auth, rbac('customers', 'view'),  ctrl.getTypeDiscounts);
router.put  ('/type-discounts',          auth, rbac('customers', 'edit'),  ctrl.updateTypeDiscounts);
router.get  ('/pending',                 auth, rbac('customers', 'view'),  ctrl.pending);
router.patch('/customers/:id',           auth, rbac('customers', 'edit'),  ctrl.updateCustomer);
router.post ('/customers/:id/approve',   auth, rbac('customers', 'edit'),  ctrl.approve);

module.exports = router;
