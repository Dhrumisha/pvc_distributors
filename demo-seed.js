// Demo seed + create-flow audit. Run: API=<base> node demo-seed.js
// Default targets the live backend. Uses the admin account.
const API = process.env.API || 'https://pvcdist-backend.onrender.com/api/v1';
const results = [];
const log = (ok, msg, extra='') => { results.push({ ok, msg }); console.log((ok ? '✓' : '✗') + ' ' + msg + (extra ? '  ' + extra : '')); };

async function req(method, path, body, token) {
  try {
    const r = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: j.data, message: j.message };
  } catch (e) { return { ok: false, status: 0, message: e.message }; }
}

const CATEGORIES = ['ACP Sheets', 'PVC Pipes', 'PVC Profiles', 'Flush Doors', 'Adhesives & Solvents'];

// product: [name, catIndex, unit, gst, hsn, badge, img, variants:[[sku, label, color, purchase, sell]]]
const PRODUCTS = [
  ['Aluminium Composite Panel 3mm', 0, 'sheet', 18, '7606', 'Bestseller', 'acp3', [
    ['ACP3-SLV-8X4', '3mm · 8x4 ft', 'Silver', 2400, 3100],
    ['ACP3-GLD-8X4', '3mm · 8x4 ft', '#d4af37', 2500, 3250],
    ['ACP3-WHT-8X4', '3mm · 8x4 ft', 'White', 2350, 3000],
  ]],
  ['Aluminium Composite Panel 4mm', 0, 'sheet', 18, '7606', 'New', 'acp4', [
    ['ACP4-SLV-8X4', '4mm · 8x4 ft', 'Silver', 2900, 3600],
    ['ACP4-RED-8X4', '4mm · 8x4 ft', '#c0392b', 3000, 3750],
  ]],
  ['PVC Pipe 1 inch', 1, 'piece', 18, '3917', '', 'pipe1', [
    ['PIPE-1IN-6M', '1 inch · 6 m · Class 3', 'White', 320, 420],
  ]],
  ['PVC Pipe 2 inch', 1, 'piece', 18, '3917', '', 'pipe2', [
    ['PIPE-2IN-6M', '2 inch · 6 m · Class 3', 'White', 560, 720],
    ['PIPE-2IN-6M-G', '2 inch · 6 m · Grey', 'Grey', 580, 740],
  ]],
  ['PVC Wall Profile Panel', 2, 'piece', 18, '3916', 'Sale', 'profile', [
    ['PROF-WD-3M', 'Wooden finish · 3 m', '#8b5a2b', 180, 260],
    ['PROF-WH-3M', 'White matte · 3 m', 'White', 170, 240],
  ]],
  ['WPC Flush Door 32mm', 3, 'piece', 18, '4418', '', 'door', [
    ['DOOR-32-7X3', '32mm · 7x3 ft', '#6b4423', 1800, 2500],
  ]],
  ['PVC Solvent Cement 500ml', 4, 'piece', 18, '3506', '', 'glue', [
    ['CEM-500', '500 ml tin', '', 140, 210],
  ]],
  ['Foam Board 5mm', 2, 'sheet', 18, '3921', '', 'foam', [
    ['FOAM-5-8X4', '5mm · 8x4 ft', 'White', 900, 1250],
  ]],
];

(async () => {
  console.log('\n=== DEMO SEED → ' + API + ' ===\n');
  const login = await req('POST', '/auth/login', { email: 'admin@pvcdist.com', password: 'Pvc@Admin2026' });
  const token = login.data?.token;
  log(!!token, 'Admin login', token ? '' : login.message);
  if (!token) return;

  // 1. Categories
  const catIds = [];
  for (const name of CATEGORIES) {
    const r = await req('POST', '/categories', { name }, token);
    catIds.push(r.data?.category?.id);
    log(r.ok, 'Category: ' + name, r.ok ? '' : r.message);
  }

  // 2. Products + variants
  const allVariantIds = [];
  let prodCount = 0, varCount = 0;
  for (const [name, ci, unit, gst, hsn, badge, img, variants] of PRODUCTS) {
    const pr = await req('POST', '/products', {
      name, category_id: catIds[ci], unit, gst_rate: gst, hsn_code: hsn,
      badge: badge || undefined, image_url: `https://picsum.photos/seed/${img}/500/375`, low_stock_threshold: 10,
    }, token);
    if (!pr.ok) { log(false, 'Product: ' + name, pr.message); continue; }
    prodCount++;
    const pid = pr.data.product.id;
    for (const [sku, label, color, purchase, sell] of variants) {
      const vr = await req('POST', `/products/${pid}/dimensions`, { sku, dimension_label: label, color: color || undefined, purchase_price: purchase, selling_price: sell }, token);
      if (vr.ok) { allVariantIds.push(vr.data.dimension.id); varCount++; }
      else log(false, '  variant ' + sku, vr.message);
    }
  }
  log(prodCount > 0, `Products created: ${prodCount}, variants: ${varCount}`);

  // 3. Opening stock (leave last 2 variants at 0 → out-of-stock demo)
  const stockItems = allVariantIds.slice(0, -2).map((id, i) => ({ product_dimension_id: id, qty: [200, 150, 120, 80, 60, 45, 30, 8][i % 8] }));
  const so = await req('POST', '/stock/opening', { items: stockItems }, token);
  log(so.ok, `Opening stock for ${stockItems.length} variants (2 left at 0 for out-of-stock demo)`, so.ok ? '' : so.message);

  // 4. Suppliers
  const SUPPLIERS = [
    { name: 'Gujarat Polymers Pvt Ltd', phone: '9824011111', email: 'sales@gujpoly.in', city: 'Ahmedabad', gst_number: '24AAAAA0000A1Z5' },
    { name: 'National PVC Industries', phone: '9824022222', email: 'info@natpvc.in', city: 'Rajkot' },
    { name: 'Shree Adhesives Co', phone: '9824033333', city: 'Surat' },
  ];
  const supIds = [];
  for (const s of SUPPLIERS) { const r = await req('POST', '/suppliers', s, token); supIds.push(r.data?.supplier?.id); log(r.ok, 'Supplier: ' + s.name, r.ok ? '' : r.message); }

  // 5. Customers (various types + credit)
  const CUSTOMERS = [
    { business_name: 'Balaji Hardware', contact_person: 'Ramesh', phone: '9898010101', email: 'balaji@example.com', customer_type: 'retail', credit_limit: 0 },
    { business_name: 'Modern Interiors', contact_person: 'Sneha', phone: '9898020202', email: 'modern@example.com', customer_type: 'wholesale_a', credit_limit: 100000, credit_days: 30 },
    { business_name: 'Elite Builders', contact_person: 'Amit', phone: '9898030303', email: 'elite@example.com', customer_type: 'wholesale_b', credit_limit: 200000, credit_days: 45 },
    { business_name: 'Gujarat Plywood Depot', contact_person: 'Kiran', phone: '9898040404', email: 'gpd@example.com', customer_type: 'custom', credit_limit: 75000, credit_days: 21 },
    { business_name: 'City Furniture Works', contact_person: 'Pooja', phone: '9898050505', email: 'cityfw@example.com', customer_type: 'retail', credit_limit: 0 },
  ];
  const custIds = [];
  for (const c of CUSTOMERS) { const r = await req('POST', '/customers', c, token); custIds.push(r.data?.customer?.id); log(r.ok, 'Customer: ' + c.business_name, r.ok ? '' : r.message); }

  // 6. Customer portal: register one + approve as wholesale_a w/ credit
  const reg = await req('POST', '/portal/register', { business_name: 'Demo Trader (portal)', email: 'demotrader@example.com', phone: '9811199999', password: 'demo123' }, null);
  log(reg.ok, 'Portal customer self-register (demotrader@example.com / demo123)', reg.ok ? '' : reg.message);
  // find its id then approve
  const find = await req('GET', '/portal-admin/pending', null, token);
  const pendingCust = (find.data?.customers || []).find(c => c.email === 'demotrader@example.com');
  if (pendingCust) {
    const appr = await req('POST', `/portal-admin/customers/${pendingCust.id}/approve`, { customer_type: 'wholesale_a', credit_limit: 80000, credit_days: 30 }, token);
    log(appr.ok, 'Approved portal customer (wholesale_a, 8% off, ₹80k credit)', appr.ok ? '' : appr.message);
  } else log(false, 'Could not find pending portal customer to approve');

  // 7. Purchase order → approve → receive (goods in)
  const po = await req('POST', '/purchase-orders', {
    supplier_id: supIds[0], order_date: new Date().toISOString().slice(0, 10),
    items: allVariantIds.slice(0, 2).map(id => ({ product_dimension_id: id, ordered_qty: 100, unit_price: 2400, gst_rate: 18 })),
  }, token);
  log(po.ok, 'Purchase Order', po.ok ? po.data.order.po_number : po.message);
  if (po.ok) {
    const poId = po.data.order.id;
    const appr = await req('POST', `/purchase-orders/${poId}/approve`, { notes: 'demo approve' }, token);
    log(appr.ok, '  PO approved', appr.ok ? '' : appr.message);
    const full = await req('GET', `/purchase-orders/${poId}`, null, token);
    const poItems = full.data?.items || [];
    const rec = await req('POST', `/purchase-orders/${poId}/receive`, {
      received_date: new Date().toISOString().slice(0, 10),
      items: poItems.map(it => ({ purchase_order_item_id: it.id, received_qty: it.ordered_qty, damaged_qty: 0 })),
    }, token);
    log(rec.ok, '  Goods received (stock in)', rec.ok ? '' : rec.message);
  }

  // 8. Supplier invoice + payment
  const sinv = await req('POST', '/purchase-invoices', { supplier_id: supIds[0], supplier_invoice_no: 'SUP-INV-001', invoice_date: new Date().toISOString().slice(0, 10), total_amount: 240000 }, token);
  log(sinv.ok, 'Supplier Invoice', sinv.ok ? '' : sinv.message);
  if (sinv.ok) {
    const sp = await req('POST', '/supplier-payments', { supplier_id: supIds[0], purchase_invoice_id: sinv.data.invoice.id, amount: 100000, mode: 'bank_transfer', payment_date: new Date().toISOString().slice(0, 10) }, token);
    log(sp.ok, '  Supplier payment ₹1,00,000', sp.ok ? '' : sp.message);
  }

  // 9. Quotation
  const qt = await req('POST', '/quotations', {
    customer_id: custIds[1], notes: 'Demo quotation',
    items: [{ product_dimension_id: allVariantIds[0], qty: 20, unit_price: 3100, gst_rate: 18, discount_pct: 5 }],
  }, token);
  log(qt.ok, 'Quotation', qt.ok ? qt.data.quotation.quotation_number : qt.message);

  // 10. Sales order → confirm → delivery → invoice → payment
  const sales = await req('POST', '/sales-orders', {
    customer_id: custIds[1], delivery_type: 'our_vehicle',
    items: [
      { product_dimension_id: allVariantIds[0], qty: 10, unit_price: 3100, gst_rate: 18, discount_pct: 0 },
      { product_dimension_id: allVariantIds[3], qty: 5, unit_price: 3600, gst_rate: 18, discount_pct: 0 },
    ],
  }, token);
  log(sales.ok, 'Sales Order', sales.ok ? sales.data.order.order_number : sales.message);
  if (sales.ok) {
    const soId = sales.data.order.id;
    const conf = await req('PATCH', `/sales-orders/${soId}/confirm`, {}, token);
    log(conf.ok, '  Sales order confirmed', conf.ok ? '' : conf.message);
    const soFull = await req('GET', `/sales-orders/${soId}`, null, token);
    const soItems = soFull.data?.items || [];
    const del = await req('POST', '/deliveries', {
      sales_order_id: soId, delivery_type: 'our_vehicle', scheduled_date: new Date().toISOString().slice(0, 10),
      items: soItems.map(it => ({ sales_order_item_id: it.id, product_dimension_id: it.product_dimension_id, dispatched_qty: it.ordered_qty })),
    }, token);
    log(del.ok, '  Delivery created (dispatch)', del.ok ? del.data.delivery.delivery_number : del.message);
    const inv = await req('POST', '/invoices', { sales_order_id: soId, invoice_date: new Date().toISOString().slice(0, 10) }, token);
    log(inv.ok, '  Invoice', inv.ok ? inv.data.invoice.invoice_number : inv.message);
    if (inv.ok) {
      const invId = inv.data.invoice.id;
      await req('PATCH', `/invoices/${invId}/issue`, {}, token);
      const pay = await req('POST', '/customer-payments', { invoice_id: invId, customer_id: custIds[1], amount: 20000, mode: 'upi', payment_date: new Date().toISOString().slice(0, 10) }, token);
      log(pay.ok, '  Customer payment ₹20,000 (partial)', pay.ok ? '' : pay.message);
      const cn = await req('POST', '/credit-notes', { invoice_id: invId, reason: 'Damaged sheet returned', items: [{ product_dimension_id: allVariantIds[0], qty: 1, unit_price: 3100, gst_rate: 18 }] }, token);
      log(cn.ok, '  Credit Note', cn.ok ? cn.data.credit_note.cn_number : cn.message);
    }
  }

  // 11. Website lead + portal order
  const enq = await req('POST', '/public/enquiries', { name: 'Walk-in Enquiry', phone: '9700000001', message: 'Need 100 ACP sheets', type: 'quote', product_interest: 'ACP Sheets' }, null);
  log(enq.ok, 'Website enquiry (lead)', enq.ok ? '' : enq.message);
  const plogin = await req('POST', '/portal/login', { email: 'demotrader@example.com', password: 'demo123' }, null);
  if (plogin.ok) {
    const ptoken = plogin.data.token;
    const porder = await req('POST', '/portal/orders', { items: [{ product_dimension_id: allVariantIds[0], qty: 3 }], payment_mode: 'credit' }, ptoken);
    log(porder.ok, 'Portal customer placed a credit (Udhaar) order', porder.ok ? porder.data.order.order_number : porder.message);
  }

  const pass = results.filter(r => r.ok).length, fail = results.filter(r => !r.ok).length;
  console.log(`\n=== DONE: ${pass} ok, ${fail} failed ===`);
  if (fail) console.log('FAILURES:\n' + results.filter(r => !r.ok).map(r => '  ✗ ' + r.msg).join('\n'));
})();
