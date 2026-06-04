// src/routes/invoices.routes.js
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const rbac    = require('../middleware/rbac');
const validate= require('../middleware/validate');
const audit   = require('../middleware/auditLog');
const ctrl    = require('../controllers/invoices.controller');
const schemas = require('../validators/invoices.schema');

router.get    ('/overdue',          auth, rbac('invoices','view'),   ctrl.overdue);
router.get    ('/',                 auth, rbac('invoices','view'),   ctrl.list);
router.post   ('/',                 auth, rbac('invoices','create'), validate(schemas.create), audit('invoices'), ctrl.create);
router.get    ('/:id',              auth, rbac('invoices','view'),   ctrl.getOne);
router.put    ('/:id',              auth, rbac('invoices','edit'),   validate(schemas.update), audit('invoices'), ctrl.update);
router.patch  ('/:id/issue',        auth, rbac('invoices','edit'),   audit('invoices'), ctrl.issue);
router.patch  ('/:id/cancel',       auth, rbac('invoices','delete'), audit('invoices'), ctrl.cancel);
router.get    ('/:id/pdf',          auth, rbac('invoices','view'),   ctrl.getPdf);
router.post   ('/:id/share',        auth, rbac('invoices','view'),   ctrl.share);
router.post   ('/:id/duplicate',    auth, rbac('invoices','create'), audit('invoices'), ctrl.duplicate);
router.post   ('/:id/irn',          auth, rbac('invoices','approve'),audit('invoices'), ctrl.generateIrn);
router.get    ('/:id/revisions',    auth, rbac('invoices','view'),   ctrl.getRevisions);
module.exports = router;
