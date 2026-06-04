// src/routes/deliveries.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const multer  = require('multer');
const ctrl    = require('../controllers/deliveries.controller');
const schemas = require('../validators/deliveries.schema');

const upload = multer({ dest: process.env.UPLOAD_DIR || 'uploads', limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880') } });

router.get    ('/pending',            auth, rbac('delivery','view'),   ctrl.pending);
router.get    ('/returns',            auth, rbac('delivery','view'),   ctrl.listAllReturns); // all returns (before /:id)
router.get    ('/',                   auth, rbac('delivery','view'),   ctrl.list);
router.post   ('/',                   auth, rbac('delivery','create'), validate(schemas.create), audit('deliveries'), ctrl.create);
router.get    ('/:id',                auth, rbac('delivery','view'),   ctrl.getOne);
router.put    ('/:id',                auth, rbac('delivery','edit'),   validate(schemas.update), audit('deliveries'), ctrl.update);
router.patch  ('/:id/status',         auth, rbac('delivery','edit'),   audit('deliveries'), ctrl.setStatus);
router.patch  ('/:id/dispatch',       auth, rbac('delivery','edit'),   audit('deliveries'), ctrl.dispatch);
router.patch  ('/:id/deliver',        auth, rbac('delivery','edit'),   audit('deliveries'), ctrl.confirmDelivery);
router.post   ('/:id/proof',          auth, rbac('delivery','edit'),   upload.single('file'), ctrl.uploadProof);
router.get    ('/:id/returns',        auth, rbac('delivery','view'),   ctrl.getReturns);
router.post   ('/:id/returns',        auth, rbac('delivery','edit'),   validate(schemas.return), audit('delivery_returns'), ctrl.createReturn);
router.patch  ('/:id/driver-payment', auth, rbac('delivery','edit'),   audit('deliveries'), ctrl.updateDriverPayment);
module.exports = router;
