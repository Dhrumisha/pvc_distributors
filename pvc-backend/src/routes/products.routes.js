// src/routes/products.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/products.controller');
const schemas = require('../validators/products.schema');

router.get    ('/low-stock',               auth, rbac('inventory','view'),   ctrl.lowStock);
router.get    ('/dead-stock',              auth, rbac('inventory','view'),   ctrl.deadStock);
router.get    ('/',                        auth, rbac('inventory','view'),   ctrl.list);
router.post   ('/',                        auth, rbac('inventory','create'), validate(schemas.create), audit('products'), ctrl.create);
router.get    ('/:id',                     auth, rbac('inventory','view'),   ctrl.getOne);
router.put    ('/:id',                     auth, rbac('inventory','edit'),   validate(schemas.update), audit('products'), ctrl.update);
router.delete ('/:id',                     auth, rbac('inventory','delete'), audit('products'), ctrl.remove);
router.get    ('/:id/dimensions',          auth, rbac('inventory','view'),   ctrl.getDimensions);
router.post   ('/:id/dimensions',          auth, rbac('inventory','create'), validate(schemas.dimension), audit('product_dimensions'), ctrl.addDimension);
router.put    ('/:id/dimensions/:did',     auth, rbac('inventory','edit'),   validate(schemas.dimensionUpdate), audit('product_dimensions'), ctrl.updateDimension);
router.delete ('/:id/dimensions/:did',     auth, rbac('inventory','delete'), audit('product_dimensions'), ctrl.removeDimension);
module.exports = router;
