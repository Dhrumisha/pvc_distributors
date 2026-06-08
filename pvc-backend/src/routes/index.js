// src/routes/index.js
const router = require('express').Router();

router.use('/public',             require('./public.routes'));      // marketing website (no auth)
router.use('/portal',             require('./portal.routes'));      // customer portal (customer auth)
router.use('/portal-admin',       require('./portalAdmin.routes')); // admin: portal settings/approvals
router.use('/enquiries',          require('./enquiries.routes'));   // admin view of website leads
router.use('/auth',               require('./auth.routes'));
router.use('/users',              require('./users.routes'));
router.use('/roles',              require('./roles.routes'));
router.use('/modules',            require('./modules.routes'));
router.use('/permissions',        require('./permissions.routes'));
router.use('/categories',         require('./categories.routes'));
router.use('/products',           require('./products.routes'));
router.use('/stock',              require('./stock.routes'));
router.use('/batch-lots',         require('./batchLots.routes'));
router.use('/restock-cart',       require('./restockCart.routes'));
router.use('/suppliers',          require('./suppliers.routes'));
router.use('/purchase-orders',    require('./purchaseOrders.routes'));
router.use('/purchase-invoices',  require('./purchaseInvoices.routes'));
router.use('/customers',          require('./customers.routes'));
router.use('/price-lists',        require('./priceLists.routes'));
router.use('/quotations',         require('./quotations.routes'));
router.use('/sales-orders',       require('./salesOrders.routes'));
router.use('/deliveries',         require('./deliveries.routes'));
router.use('/vehicles',           require('./vehicles.routes'));
router.use('/route-groups',       require('./routeGroups.routes'));
router.use('/invoices',           require('./invoices.routes'));
router.use('/credit-notes',       require('./creditNotes.routes'));
router.use('/customer-payments',  require('./customerPayments.routes'));
router.use('/supplier-payments',  require('./supplierPayments.routes'));
router.use('/customer-ledger',    require('./customerLedger.routes'));
router.use('/dashboard',          require('./dashboard.routes'));
router.use('/reports',            require('./reports.routes'));
router.use('/notifications',      require('./notifications.routes'));
router.use('/alerts',             require('./alerts.routes'));
router.use('/audit-logs',         require('./auditLogs.routes'));

module.exports = router;
