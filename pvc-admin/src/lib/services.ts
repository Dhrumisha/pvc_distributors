// src/lib/services.ts
// ─────────────────────────────────────────────────────────────────────────────
// All API calls organised by module.
// Every screen imports from here — never calls api.ts directly.
// ─────────────────────────────────────────────────────────────────────────────
import api from './api';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login:           (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh:         () => api.post('/auth/refresh'),
  logout:          () => api.post('/auth/logout'),

  // Forgot password — sends reset email
  forgotPassword:  (email: string) =>
    api.post('/auth/forgot-password', { email }),

  // Reset password via token from email link
  resetPassword:   (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),

  // Verify that a reset/invite token is still valid (before showing form)
  verifyToken:     (token: string, type: 'reset' | 'invite') =>
    api.get(`/auth/verify-token`, { params: { token, type } }),

  // Set password — used by newly invited users (token from invite email)
  setPassword:     (token: string, password: string) =>
    api.post('/auth/set-password', { token, password }),

  // Change password when already logged in
  changePassword:  (current_password: string, new_password: string) =>
    api.patch('/auth/change-password', { current_password, new_password }),

  me:        () => api.get('/auth/me'),
  updateMe:  (data: object) => api.patch('/auth/me', data),
};

// ── Users (Admin only) ────────────────────────────────────────────────────────
export const userService = {
  list:        (params?: object) => api.get('/users', { params }),
  create:      (data: object)    => api.post('/users', data),          // triggers invite email
  get:         (id: number)      => api.get(`/users/${id}`),
  update:      (id: number, data: object) => api.put(`/users/${id}`, data),
  setStatus:   (id: number, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
  remove:      (id: number)      => api.delete(`/users/${id}`),
  assignRoles: (id: number, role_ids: number[]) =>
    api.post(`/users/${id}/roles`, { role_ids }),
  removeRole:  (id: number, roleId: number) =>
    api.delete(`/users/${id}/roles/${roleId}`),
  resendInvite:(id: number) => api.post(`/users/${id}/resend-invite`), // resend set-password email
};

// ── Roles ─────────────────────────────────────────────────────────────────────
export const roleService = {
  list:             ()           => api.get('/roles'),
  create:           (data: object) => api.post('/roles', data),
  get:              (id: number) => api.get(`/roles/${id}`),
  update:           (id: number, data: object) => api.put(`/roles/${id}`, data),
  remove:           (id: number) => api.delete(`/roles/${id}`),
  getPermissions:   (id: number) => api.get(`/roles/${id}/permissions`),
  addPermissions:   (id: number, module_action_ids: number[]) =>
    api.post(`/roles/${id}/permissions`, { module_action_ids }),
  removePermission: (id: number, pid: number) =>
    api.delete(`/roles/${id}/permissions/${pid}`),
  matrix:           ()           => api.get('/roles/matrix'),
};

// ── Modules & Permissions (for role permission editor) ──────────────────────────
export const moduleService = {
  list:       ()           => api.get('/modules'),
  getActions: (id: number) => api.get(`/modules/${id}/actions`),
};

export const permissionService = {
  list: (params?: object) => api.get('/permissions', { params }),
};

// ── Batch / Lots ────────────────────────────────────────────────────────────
export const batchLotService = {
  list:   (params?: object) => api.get('/batch-lots', { params }),
  create: (data: object)    => api.post('/batch-lots', data),
  get:    (id: number)      => api.get(`/batch-lots/${id}`),
};

// ── Restock Cart ────────────────────────────────────────────────────────────
export const restockCartService = {
  get:         ()                 => api.get('/restock-cart'),
  addItem:     (data: object)     => api.post('/restock-cart/items', data),
  updateItem:  (id: number, data: object) => api.put(`/restock-cart/items/${id}`, data),
  removeItem:  (id: number)       => api.delete(`/restock-cart/items/${id}`),
  convert:     (data?: object)    => api.post('/restock-cart/convert', data),
  autoSuggest: (data?: object)    => api.post('/restock-cart/auto-suggest', data),
};

// ── Vehicles ────────────────────────────────────────────────────────────────
export const vehicleService = {
  list:      (params?: object) => api.get('/vehicles', { params }),
  create:    (data: object)    => api.post('/vehicles', data),
  get:       (id: number)      => api.get(`/vehicles/${id}`),
  update:    (id: number, data: object) => api.put(`/vehicles/${id}`, data),
  setStatus: (id: number, status: string) => api.patch(`/vehicles/${id}/status`, { status }),
};

// ── Route Groups ────────────────────────────────────────────────────────────
export const routeGroupService = {
  list:   (params?: object) => api.get('/route-groups', { params }),
  create: (data: object)    => api.post('/route-groups', data),
  get:    (id: number)      => api.get(`/route-groups/${id}`),
  update: (id: number, data: object) => api.put(`/route-groups/${id}`, data),
};

// ── Purchase Invoices (supplier invoices) ──────────────────────────────────────
export const purchaseInvoiceService = {
  list:      (params?: object) => api.get('/purchase-invoices', { params }),
  create:    (data: object)    => api.post('/purchase-invoices', data),
  get:       (id: number)      => api.get(`/purchase-invoices/${id}`),
  update:    (id: number, data: object) => api.put(`/purchase-invoices/${id}`, data),
  setStatus: (id: number, status: string) => api.patch(`/purchase-invoices/${id}/status`, { status }),
};

// ── Goods Receipts (global list) ──────────────────────────────────────────────
export const goodsReceiptService = {
  list: (params?: object) => api.get('/purchase-orders/receipts', { params }),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryService = {
  list:   (params?: object) => api.get('/categories', { params }),
  create: (data: object)    => api.post('/categories', data),
  get:    (id: number)      => api.get(`/categories/${id}`),
  update: (id: number, data: object) => api.put(`/categories/${id}`, data),
  remove: (id: number)      => api.delete(`/categories/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productService = {
  list:            (params?: object) => api.get('/products', { params }),
  create:          (data: object)    => api.post('/products', data),
  get:             (id: number)      => api.get(`/products/${id}`),
  update:          (id: number, data: object) => api.put(`/products/${id}`, data),
  remove:          (id: number)      => api.delete(`/products/${id}`),
  lowStock:        (params?: object) => api.get('/products/low-stock', { params }),
  deadStock:       (params?: object) => api.get('/products/dead-stock', { params }),
  getDimensions:   (id: number)      => api.get(`/products/${id}/dimensions`),
  addDimension:    (id: number, data: object) =>
    api.post(`/products/${id}/dimensions`, data),
  updateDimension: (id: number, did: number, data: object) =>
    api.put(`/products/${id}/dimensions/${did}`, data),
  removeDimension: (id: number, did: number) =>
    api.delete(`/products/${id}/dimensions/${did}`),
};

// ── Stock ─────────────────────────────────────────────────────────────────────
export const stockService = {
  list:         (params?: object) => api.get('/stock', { params }),
  get:          (dimensionId: number, params?: object) =>
    api.get(`/stock/${dimensionId}`, { params }),
  openingBulk:  (items: object[]) => api.post('/stock/opening', { items }),
  adjustment:   (data: object)    => api.post('/stock/adjustment', data),
  damage:       (data: object)    => api.post('/stock/damage', data),
  reservations: (params?: object) => api.get('/stock/reservations', { params }),
};

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const supplierService = {
  list:         (params?: object) => api.get('/suppliers', { params }),
  create:       (data: object)    => api.post('/suppliers', data),
  get:          (id: number)      => api.get(`/suppliers/${id}`),
  update:       (id: number, data: object) => api.put(`/suppliers/${id}`, data),
  remove:       (id: number)      => api.delete(`/suppliers/${id}`),
  getProducts:  (id: number)      => api.get(`/suppliers/${id}/products`),
  addProduct:   (id: number, data: object) =>
    api.post(`/suppliers/${id}/products`, data),
  removeProduct:(id: number, pdid: number) =>
    api.delete(`/suppliers/${id}/products/${pdid}`),
  priceHistory: (id: number, params?: object) =>
    api.get(`/suppliers/${id}/price-history`, { params }),
  addPrice:     (id: number, data: object) =>
    api.post(`/suppliers/${id}/price-history`, data),
  getPOs:       (id: number, params?: object) =>
    api.get(`/suppliers/${id}/purchase-orders`, { params }),
  outstanding:  (id: number)      => api.get(`/suppliers/${id}/outstanding`),
};

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const purchaseOrderService = {
  list:        (params?: object) => api.get('/purchase-orders', { params }),
  create:      (data: object)    => api.post('/purchase-orders', data),
  get:         (id: number)      => api.get(`/purchase-orders/${id}`),
  update:      (id: number, data: object) => api.put(`/purchase-orders/${id}`, data),
  remove:      (id: number)      => api.delete(`/purchase-orders/${id}`),
  setStatus:   (id: number, status: string) =>
    api.patch(`/purchase-orders/${id}/status`, { status }),
  approve:     (id: number, notes?: string) =>
    api.post(`/purchase-orders/${id}/approve`, { notes }),
  receive:     (id: number, data: object) =>
    api.post(`/purchase-orders/${id}/receive`, data),
  getReceipts: (id: number)      => api.get(`/purchase-orders/${id}/receipts`),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerService = {
  list:             (params?: object) => api.get('/customers', { params }),
  create:           (data: object)    => api.post('/customers', data),
  get:              (id: number)      => api.get(`/customers/${id}`),
  update:           (id: number, data: object) => api.put(`/customers/${id}`, data),
  remove:           (id: number)      => api.delete(`/customers/${id}`),
  setHold:          (id: number, is_on_hold: boolean, hold_reason?: string) =>
    api.patch(`/customers/${id}/hold`, { is_on_hold, hold_reason }),
  getOrders:        (id: number, params?: object) =>
    api.get(`/customers/${id}/orders`, { params }),
  getLedger:        (id: number, params?: object) =>
    api.get(`/customers/${id}/ledger`, { params }),
  getStatement:     (id: number, params?: object) =>
    api.get(`/customers/${id}/statement`, { params }),
  getOutstanding:   (id: number)      => api.get(`/customers/${id}/outstanding`),
  getProfitability: (id: number, params?: object) =>
    api.get(`/customers/${id}/profitability`, { params }),
  getCreditStatus:  (id: number)      => api.get(`/customers/${id}/credit-status`),
  getAddresses:     (id: number)      => api.get(`/customers/${id}/addresses`),
  addAddress:       (id: number, data: object) =>
    api.post(`/customers/${id}/addresses`, data),
  updateAddress:    (id: number, aid: number, data: object) =>
    api.put(`/customers/${id}/addresses/${aid}`, data),
  setDefaultAddr:   (id: number, aid: number) =>
    api.patch(`/customers/${id}/addresses/${aid}/default`),
  removeAddress:    (id: number, aid: number) =>
    api.delete(`/customers/${id}/addresses/${aid}`),
};

// ── Price Lists ───────────────────────────────────────────────────────────────
export const priceListService = {
  list:       ()              => api.get('/price-lists'),
  create:     (data: object)  => api.post('/price-lists', data),
  get:        (id: number)    => api.get(`/price-lists/${id}`),
  update:     (id: number, data: object) => api.put(`/price-lists/${id}`, data),
  remove:     (id: number)    => api.delete(`/price-lists/${id}`),
  getItems:   (id: number, params?: object) =>
    api.get(`/price-lists/${id}/items`, { params }),
  addItem:    (id: number, data: object) =>
    api.post(`/price-lists/${id}/items`, data),
  updateItem: (id: number, iid: number, data: object) =>
    api.put(`/price-lists/${id}/items/${iid}`, data),
  removeItem: (id: number, iid: number) =>
    api.delete(`/price-lists/${id}/items/${iid}`),
  bulkImport: (id: number, items: object[]) =>
    api.post(`/price-lists/${id}/bulk-import`, { items }),
};

// ── Quotations ────────────────────────────────────────────────────────────────
export const quotationService = {
  list:      (params?: object) => api.get('/quotations', { params }),
  create:    (data: object)    => api.post('/quotations', data),
  get:       (id: number)      => api.get(`/quotations/${id}`),
  update:    (id: number, data: object) => api.put(`/quotations/${id}`, data),
  setStatus: (id: number, status: string) =>
    api.patch(`/quotations/${id}/status`, { status }),
  convert:   (id: number, data: object) =>
    api.post(`/quotations/${id}/convert`, data),
  getPdf:    (id: number) =>
    api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
  share:     (id: number, data: object) =>
    api.post(`/quotations/${id}/share`, data),
};

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const salesOrderService = {
  list:          (params?: object) => api.get('/sales-orders', { params }),
  create:        (data: object)    => api.post('/sales-orders', data),
  get:           (id: number)      => api.get(`/sales-orders/${id}`),
  update:        (id: number, data: object) => api.put(`/sales-orders/${id}`, data),
  confirm:       (id: number)      => api.patch(`/sales-orders/${id}/confirm`),
  cancel:        (id: number, reason: string) =>
    api.patch(`/sales-orders/${id}/cancel`, { reason }),
  approve:       (id: number, notes?: string) =>
    api.post(`/sales-orders/${id}/approve`, { notes }),
  getAmendments: (id: number)      => api.get(`/sales-orders/${id}/amendments`),
  stockCheck:    (id: number)      => api.get(`/sales-orders/${id}/stock-check`),
  getTemplates:  (params?: object) => api.get('/sales-orders/templates', { params }),
  saveTemplate:  (id: number, template_name: string) =>
    api.post(`/sales-orders/${id}/save-template`, { template_name }),
  fromTemplate:  (id: number, data?: object) =>
    api.post(`/sales-orders/from-template/${id}`, data),
};

// ── Deliveries ────────────────────────────────────────────────────────────────
export const deliveryService = {
  list:           (params?: object) => api.get('/deliveries', { params }),
  create:         (data: object)    => api.post('/deliveries', data),
  get:            (id: number)      => api.get(`/deliveries/${id}`),
  update:         (id: number, data: object) => api.put(`/deliveries/${id}`, data),
  setStatus:      (id: number, status: string, notes?: string) =>
    api.patch(`/deliveries/${id}/status`, { status, notes }),
  dispatch:       (id: number, data?: object) =>
    api.patch(`/deliveries/${id}/dispatch`, data),
  confirmDeliver: (id: number, data: object) =>
    api.patch(`/deliveries/${id}/deliver`, data),
  uploadProof:    (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/deliveries/${id}/proof`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  pending:      (params?: object) => api.get('/deliveries/pending', { params }),
  allReturns:   (params?: object) => api.get('/deliveries/returns', { params }),
  createReturn: (id: number, data: object) =>
    api.post(`/deliveries/${id}/returns`, data),
  getReturns:   (id: number)      => api.get(`/deliveries/${id}/returns`),
  updateDriverPay: (id: number, data: object) =>
    api.patch(`/deliveries/${id}/driver-payment`, data),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoiceService = {
  list:         (params?: object) => api.get('/invoices', { params }),
  create:       (data: object)    => api.post('/invoices', data),
  get:          (id: number)      => api.get(`/invoices/${id}`),
  update:       (id: number, data: object) => api.put(`/invoices/${id}`, data),
  issue:        (id: number)      => api.patch(`/invoices/${id}/issue`),
  cancel:       (id: number, reason: string) =>
    api.patch(`/invoices/${id}/cancel`, { reason }),
  getPdf:       (id: number) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  share:        (id: number, data: object)   => api.post(`/invoices/${id}/share`, data),
  duplicate:    (id: number)      => api.post(`/invoices/${id}/duplicate`),
  generateIrn:  (id: number)      => api.post(`/invoices/${id}/irn`),
  overdue:      (params?: object) => api.get('/invoices/overdue', { params }),
  getRevisions: (id: number)      => api.get(`/invoices/${id}/revisions`),
};

// ── Credit Notes ──────────────────────────────────────────────────────────────
export const creditNoteService = {
  list:   (params?: object) => api.get('/credit-notes', { params }),
  create: (data: object)    => api.post('/credit-notes', data),
  get:    (id: number)      => api.get(`/credit-notes/${id}`),
  issue:  (id: number)      => api.patch(`/credit-notes/${id}/issue`),
  apply:  (id: number, apply_to_invoice_id: number) =>
    api.patch(`/credit-notes/${id}/apply`, { apply_to_invoice_id }),
  getPdf: (id: number) =>
    api.get(`/credit-notes/${id}/pdf`, { responseType: 'blob' }),
};

// ── Customer Payments ─────────────────────────────────────────────────────────
export const customerPaymentService = {
  list:        (params?: object) => api.get('/customer-payments', { params }),
  create:      (data: object)    => api.post('/customer-payments', data),
  get:         (id: number)      => api.get(`/customer-payments/${id}`),
  chequesDue:  (params?: object) => api.get('/customer-payments/cheques-due', { params }),
  aging:       (params?: object) => api.get('/customer-payments/aging', { params }),
  logReminder: (id: number, data: object) =>
    api.post(`/customer-payments/${id}/reminder`, data),
};

// ── Supplier Payments ─────────────────────────────────────────────────────────
export const supplierPaymentService = {
  list:        (params?: object) => api.get('/supplier-payments', { params }),
  create:      (data: object)    => api.post('/supplier-payments', data),
  get:         (id: number)      => api.get(`/supplier-payments/${id}`),
  outstanding: (params?: object) =>
    api.get('/supplier-payments/outstanding', { params }),
};

// ── Customer Ledger ───────────────────────────────────────────────────────────
export const ledgerService = {
  get:     (customerId: number, params?: object) =>
    api.get(`/customer-ledger/${customerId}`, { params }),
  summary: (customerId: number) =>
    api.get(`/customer-ledger/${customerId}/summary`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  summary:           (params?: object) => api.get('/dashboard/summary', { params }),
  activity:          ()                => api.get('/dashboard/activity'),
  lowStock:          ()                => api.get('/dashboard/low-stock'),
  overduePayments:   (params?: object) => api.get('/dashboard/overdue-payments', { params }),
  pendingDeliveries: ()                => api.get('/dashboard/pending-deliveries'),
  revenueChart:      (params?: object) => api.get('/dashboard/revenue-chart', { params }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportService = {
  sales:                 (params?: object) => api.get('/reports/sales', { params }),
  purchases:             (params?: object) => api.get('/reports/purchases', { params }),
  profitLoss:            (params?: object) => api.get('/reports/profit-loss', { params }),
  customerProfitability: (params?: object) => api.get('/reports/customer-profitability', { params }),
  salesStaff:            (params?: object) => api.get('/reports/sales-staff', { params }),
  stock:                 (params?: object) => api.get('/reports/stock', { params }),
  stockMovement:         (params?: object) => api.get('/reports/stock-movement', { params }),
  deadStock:             (params?: object) => api.get('/reports/dead-stock', { params }),
  payments:              (params?: object) => api.get('/reports/payments', { params }),
  outstanding:           (params?: object) => api.get('/reports/outstanding', { params }),
  aging:                 (params?: object) => api.get('/reports/aging', { params }),
  gst:                   (params?: object) => api.get('/reports/gst', { params }),
  supplierPriceTrend:    (params?: object) => api.get('/reports/supplier-price-trend', { params }),
  deliveries:            (params?: object) => api.get('/reports/deliveries', { params }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  list:        (params?: object) => api.get('/notifications', { params }),
  markRead:    (id: number)      => api.patch(`/notifications/${id}/read`),
  markAllRead: ()                => api.post('/notifications/read-all'),
  remove:      (id: number)      => api.delete(`/notifications/${id}`),
  unreadCount: ()                => api.get('/notifications/unread-count'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditService = {
  list:   (params?: object) => api.get('/audit-logs', { params }),
  get:    (id: number)      => api.get(`/audit-logs/${id}`),
  export: (params?: object) =>
    api.get('/audit-logs/export', { params, responseType: 'blob' }),
};

// ── Leads / Website Enquiries ───────────────────────────────────────────────
export const enquiryService = {
  list:        (params?: object) => api.get('/enquiries', { params }),
  get:         (id: number)      => api.get(`/enquiries/${id}`),
  setStatus:   (id: number, status: string) => api.patch(`/enquiries/${id}/status`, { status }),
  remove:      (id: number)      => api.delete(`/enquiries/${id}`),
  unreadCount: ()                => api.get('/enquiries/unread-count'),
};

// ── Customer Portal admin (type discounts + approvals) ──────────────────────
export const portalAdminService = {
  typeDiscounts:       ()              => api.get('/portal-admin/type-discounts'),
  saveTypeDiscounts:   (items: object[]) => api.put('/portal-admin/type-discounts', { items }),
  pending:             ()              => api.get('/portal-admin/pending'),
  updateCustomer:      (id: number, data: object) => api.patch(`/portal-admin/customers/${id}`, data),
  approve:             (id: number, data: object) => api.post(`/portal-admin/customers/${id}/approve`, data),
};
