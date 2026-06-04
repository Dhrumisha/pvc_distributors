// src/routes/restockCart.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const audit  = require('../middleware/auditLog');
const ctrl   = require('../controllers/restockCart.controller');
router.get    ('/',              auth, rbac('inventory','view'),   ctrl.get);
router.post   ('/items',         auth, rbac('inventory','edit'),   audit('restock_cart'), ctrl.addItem);
router.put    ('/items/:id',     auth, rbac('inventory','edit'),   audit('restock_cart'), ctrl.updateItem);
router.delete ('/items/:id',     auth, rbac('inventory','edit'),   audit('restock_cart'), ctrl.removeItem);
router.post   ('/convert',       auth, rbac('suppliers','create'), audit('purchase_orders'), ctrl.convert);
router.post   ('/auto-suggest',  auth, rbac('inventory','view'),   ctrl.autoSuggest);
module.exports = router;
