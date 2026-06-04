// src/routes/priceLists.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/priceLists.controller');
router.get    ('/',                  auth, rbac('customers','view'),   ctrl.list);
router.post   ('/',                  auth, rbac('customers','create'), audit('price_lists'), ctrl.create);
router.get    ('/:id',               auth, rbac('customers','view'),   ctrl.getOne);
router.put    ('/:id',               auth, rbac('customers','edit'),   audit('price_lists'), ctrl.update);
router.delete ('/:id',               auth, rbac('customers','delete'), audit('price_lists'), ctrl.remove);
router.get    ('/:id/items',         auth, rbac('customers','view'),   ctrl.getItems);
router.post   ('/:id/items',         auth, rbac('customers','edit'),   audit('price_list_items'), ctrl.addItem);
router.put    ('/:id/items/:iid',    auth, rbac('customers','edit'),   audit('price_list_items'), ctrl.updateItem);
router.delete ('/:id/items/:iid',    auth, rbac('customers','edit'),   audit('price_list_items'), ctrl.removeItem);
router.post   ('/:id/bulk-import',   auth, rbac('customers','edit'),   audit('price_list_items'), ctrl.bulkImport);
module.exports = router;
