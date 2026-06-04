// src/config/migrations/002_business_tables.js
exports.up = async (knex) => {

  // categories
  await knex.schema.createTable('categories', t => {
    t.bigIncrements('id');
    t.string('name',100).notNullable().unique();
    t.text('description');
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
  });

  // suppliers
  await knex.schema.createTable('suppliers', t => {
    t.bigIncrements('id');
    t.string('name',150).notNullable();
    t.string('contact_person',100); t.string('phone',20); t.string('email',150);
    t.text('address'); t.string('city',100); t.string('state',100); t.string('pincode',10);
    t.string('gst_number',20); t.string('payment_terms',100); t.integer('credit_days').defaultTo(0);
    t.integer('rating'); t.text('performance_notes');
    t.integer('is_active').notNullable().defaultTo(1);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true); t.timestamp('deleted_at');
  });

  // products
  await knex.schema.createTable('products', t => {
    t.bigIncrements('id');
    t.string('name',150).notNullable();
    t.bigInteger('category_id').notNullable().references('id').inTable('categories');
    t.bigInteger('default_supplier_id').references('id').inTable('suppliers');
    t.string('unit',20).notNullable().defaultTo('piece');
    t.string('hsn_code',20);
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('low_stock_threshold',10,3).notNullable().defaultTo(10);
    t.integer('is_active').notNullable().defaultTo(1);
    t.text('description');
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true); t.timestamp('deleted_at');
    t.index('category_id'); t.index('default_supplier_id');
  });

  // product_dimensions (SKUs)
  await knex.schema.createTable('product_dimensions', t => {
    t.bigIncrements('id');
    t.bigInteger('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('sku',50).notNullable().unique();
    t.string('dimension_label',80).notNullable();
    t.decimal('width_mm',8,2); t.decimal('height_mm',8,2); t.decimal('thickness_mm',8,2);
    t.decimal('purchase_price',15,2).notNullable().defaultTo(0);
    t.decimal('selling_price',15,2).notNullable().defaultTo(0);
    t.integer('is_active').notNullable().defaultTo(1);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('product_id'); t.index('sku');
  });

  // batch_lots
  await knex.schema.createTable('batch_lots', t => {
    t.bigIncrements('id');
    t.string('lot_number',80).notNullable().unique();
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.bigInteger('purchase_order_id');
    t.date('received_date').notNullable();
    t.text('notes');
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('supplier_id');
  });

  // stock_ledger (append-only)
  await knex.schema.createTable('stock_ledger', t => {
    t.bigIncrements('id');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.bigInteger('batch_lot_id').references('id').inTable('batch_lots');
    t.decimal('qty_change',10,3).notNullable();
    t.decimal('qty_after',10,3).notNullable();
    t.string('txn_type',40).notNullable();
    t.string('ref_type',40); t.bigInteger('ref_id');
    t.text('notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('product_dimension_id'); t.index('txn_type'); t.index('created_at');
  });

  // restock_cart
  await knex.schema.createTable('restock_cart', t => {
    t.bigIncrements('id');
    t.string('name',150).notNullable().defaultTo('Restock Draft');
    t.string('status',20).notNullable().defaultTo('draft');
    t.text('notes');
    t.bigInteger('converted_po_id');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable();
    t.bigInteger('updated_by');
    t.timestamps(true, true);
  });

  // restock_cart_items
  await knex.schema.createTable('restock_cart_items', t => {
    t.bigIncrements('id');
    t.bigInteger('restock_cart_id').notNullable().references('id').inTable('restock_cart').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('current_stock',10,3).notNullable();
    t.decimal('suggested_qty',10,3).notNullable();
    t.decimal('override_qty',10,3);
    t.string('added_reason',30).notNullable().defaultTo('manual');
    t.timestamps(true, true);
    t.index('restock_cart_id');
  });

  // supplier_products
  await knex.schema.createTable('supplier_products', t => {
    t.bigIncrements('id');
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.string('supplier_sku_code',80);
    t.decimal('last_purchase_price',15,2);
    t.integer('lead_time_days');
    t.integer('is_preferred').notNullable().defaultTo(0);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.unique(['supplier_id','product_dimension_id']);
  });

  // supplier_price_history (append-only)
  await knex.schema.createTable('supplier_price_history', t => {
    t.bigIncrements('id');
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('price',15,2).notNullable();
    t.date('effective_date').notNullable();
    t.text('notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('recorded_by').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('supplier_id'); t.index('product_dimension_id'); t.index('effective_date');
  });

  // purchase_orders
  await knex.schema.createTable('purchase_orders', t => {
    t.bigIncrements('id');
    t.string('po_number',40).notNullable().unique();
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.string('status',30).notNullable().defaultTo('draft');
    t.date('order_date').notNullable();
    t.date('expected_delivery'); t.date('actual_delivery');
    t.text('notes');
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.string('source',20).notNullable().defaultTo('manual');
    t.bigInteger('restock_cart_id').references('id').inTable('restock_cart');
    t.bigInteger('approved_by').references('id').inTable('auth_users');
    t.string('status_label',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('supplier_id'); t.index('status');
  });

  // purchase_order_items
  await knex.schema.createTable('purchase_order_items', t => {
    t.bigIncrements('id');
    t.bigInteger('purchase_order_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('ordered_qty',10,3).notNullable();
    t.decimal('received_qty',10,3).notNullable().defaultTo(0);
    t.decimal('unit_price',15,2).notNullable();
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('line_total',15,2).notNullable();
    t.timestamps(true, true);
    t.index('purchase_order_id');
  });

  // goods_receipts
  await knex.schema.createTable('goods_receipts', t => {
    t.bigIncrements('id');
    t.bigInteger('purchase_order_id').notNullable().references('id').inTable('purchase_orders');
    t.bigInteger('batch_lot_id').references('id').inTable('batch_lots');
    t.date('received_date').notNullable();
    t.text('notes');
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('received_by').notNullable();
    t.timestamps(true, true);
    t.index('purchase_order_id');
  });

  // goods_receipt_items
  await knex.schema.createTable('goods_receipt_items', t => {
    t.bigIncrements('id');
    t.bigInteger('goods_receipt_id').notNullable().references('id').inTable('goods_receipts').onDelete('CASCADE');
    t.bigInteger('purchase_order_item_id').notNullable().references('id').inTable('purchase_order_items');
    t.decimal('received_qty',10,3).notNullable();
    t.decimal('damaged_qty',10,3).notNullable().defaultTo(0);
    t.decimal('accepted_qty',10,3).notNullable();
    t.timestamps(true, true);
    t.index('goods_receipt_id');
  });

  // customers
  await knex.schema.createTable('customers', t => {
    t.bigIncrements('id');
    t.string('business_name',150).notNullable();
    t.string('contact_person',100); t.string('phone',20); t.string('email',150);
    t.string('gst_number',20);
    t.string('customer_type',20).notNullable().defaultTo('retail');
    t.decimal('credit_limit',15,2).notNullable().defaultTo(0);
    t.integer('credit_days').notNullable().defaultTo(0);
    t.bigInteger('price_list_id');
    t.integer('is_on_hold').notNullable().defaultTo(0);
    t.text('hold_reason'); t.text('notes');
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true); t.timestamp('deleted_at');
  });

  // customer_addresses
  await knex.schema.createTable('customer_addresses', t => {
    t.bigIncrements('id');
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.string('label',80); t.text('address_line').notNullable();
    t.string('city',100).notNullable(); t.string('state',100); t.string('pincode',10);
    t.integer('is_default').notNullable().defaultTo(0);
    t.integer('is_active').notNullable().defaultTo(1);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('customer_id');
  });

  // price_lists
  await knex.schema.createTable('price_lists', t => {
    t.bigIncrements('id');
    t.string('name',100).notNullable().unique();
    t.text('description');
    t.integer('is_active').notNullable().defaultTo(1);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
  });

  // price_list_items
  await knex.schema.createTable('price_list_items', t => {
    t.bigIncrements('id');
    t.bigInteger('price_list_id').notNullable().references('id').inTable('price_lists').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('selling_price',15,2).notNullable();
    t.decimal('min_qty',10,3).notNullable().defaultTo(0);
    t.date('valid_from'); t.date('valid_until');
    t.timestamps(true, true);
    t.unique(['price_list_id','product_dimension_id']);
    t.index('price_list_id');
  });

  // Add price_list_id FK to customers now that price_lists exists
  await knex.schema.table('customers', t => {
    t.foreign('price_list_id').references('id').inTable('price_lists');
  });

  // quotations
  await knex.schema.createTable('quotations', t => {
    t.bigIncrements('id');
    t.string('quotation_number',40).notNullable().unique();
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.string('status',20).notNullable().defaultTo('draft');
    t.date('valid_until'); t.text('notes');
    t.decimal('subtotal',15,2).notNullable().defaultTo(0);
    t.decimal('tax_amount',15,2).notNullable().defaultTo(0);
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.bigInteger('converted_order_id');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('customer_id'); t.index('status');
  });

  // quotation_items
  await knex.schema.createTable('quotation_items', t => {
    t.bigIncrements('id');
    t.bigInteger('quotation_id').notNullable().references('id').inTable('quotations').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('qty',10,3).notNullable();
    t.decimal('locked_unit_price',15,2).notNullable();
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('discount_pct',5,2).notNullable().defaultTo(0);
    t.decimal('line_total',15,2).notNullable();
    t.timestamps(true, true);
    t.index('quotation_id');
  });

  // sales_orders
  await knex.schema.createTable('sales_orders', t => {
    t.bigIncrements('id');
    t.string('order_number',40).notNullable().unique();
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.bigInteger('delivery_address_id').references('id').inTable('customer_addresses');
    t.bigInteger('quotation_id').references('id').inTable('quotations');
    t.string('status',30).notNullable().defaultTo('draft');
    t.date('order_date').notNullable();
    t.date('required_date');
    t.string('delivery_type',20).notNullable().defaultTo('our_vehicle');
    t.text('notes');
    t.decimal('subtotal',15,2).notNullable().defaultTo(0);
    t.decimal('tax_amount',15,2).notNullable().defaultTo(0);
    t.decimal('transport_charge',15,2).notNullable().defaultTo(0);
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.integer('is_template').notNullable().defaultTo(0);
    t.string('template_name',100);
    t.bigInteger('approved_by').references('id').inTable('auth_users');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('customer_id'); t.index('status'); t.index('order_date');
  });

  // sales_order_items
  await knex.schema.createTable('sales_order_items', t => {
    t.bigIncrements('id');
    t.bigInteger('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('ordered_qty',10,3).notNullable();
    t.decimal('dispatched_qty',10,3).notNullable().defaultTo(0);
    t.decimal('unit_price',15,2).notNullable();
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('discount_pct',5,2).notNullable().defaultTo(0);
    t.decimal('line_total',15,2).notNullable();
    t.decimal('margin_pct',5,2);
    t.timestamps(true, true);
    t.index('sales_order_id');
  });

  // order_amendments (append-only)
  await knex.schema.createTable('order_amendments', t => {
    t.bigIncrements('id');
    t.bigInteger('sales_order_id').notNullable().references('id').inTable('sales_orders');
    t.string('field_changed',100).notNullable();
    t.text('old_value'); t.text('new_value'); t.text('reason');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('amended_by').notNullable();
    t.timestamp('amended_at').notNullable().defaultTo(knex.fn.now());
    t.index('sales_order_id');
  });

  // vehicles
  await knex.schema.createTable('vehicles', t => {
    t.bigIncrements('id');
    t.string('vehicle_number',20).notNullable().unique();
    t.string('vehicle_type',20).notNullable().defaultTo('tempo');
    t.string('driver_name',100).notNullable();
    t.string('driver_phone',20); t.decimal('capacity_kg',10,2); t.text('notes');
    t.integer('is_active').notNullable().defaultTo(1);
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by'); t.bigInteger('updated_by');
    t.timestamps(true, true);
  });

  // route_groups
  await knex.schema.createTable('route_groups', t => {
    t.bigIncrements('id');
    t.string('name',100).notNullable();
    t.bigInteger('vehicle_id').references('id').inTable('vehicles');
    t.date('trip_date').notNullable();
    t.text('notes');
    t.string('status',20).defaultTo('ACTIVE');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('vehicle_id'); t.index('trip_date');
  });

  // deliveries
  await knex.schema.createTable('deliveries', t => {
    t.bigIncrements('id');
    t.string('delivery_number',40).notNullable().unique();
    t.bigInteger('sales_order_id').notNullable().references('id').inTable('sales_orders');
    t.bigInteger('vehicle_id').references('id').inTable('vehicles');
    t.string('delivery_type',20).notNullable().defaultTo('our_vehicle');
    t.string('status',20).notNullable().defaultTo('scheduled');
    t.date('scheduled_date');
    t.timestamp('dispatched_at'); t.timestamp('delivered_at');
    t.decimal('transport_cost',15,2).notNullable().defaultTo(0);
    t.integer('cost_to_customer').notNullable().defaultTo(0);
    t.bigInteger('route_group_id').references('id').inTable('route_groups');
    t.text('delivery_notes'); t.string('proof_url',500);
    t.decimal('driver_payment',15,2).notNullable().defaultTo(0);
    t.date('driver_paid_at');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('sales_order_id'); t.index('vehicle_id'); t.index('status');
  });

  // delivery_items
  await knex.schema.createTable('delivery_items', t => {
    t.bigIncrements('id');
    t.bigInteger('delivery_id').notNullable().references('id').inTable('deliveries').onDelete('CASCADE');
    t.bigInteger('sales_order_item_id').notNullable().references('id').inTable('sales_order_items');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('dispatched_qty',10,3).notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('delivery_id');
  });

  // invoices
  await knex.schema.createTable('invoices', t => {
    t.bigIncrements('id');
    t.string('invoice_number',40).notNullable().unique();
    t.bigInteger('sales_order_id').notNullable().references('id').inTable('sales_orders');
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.bigInteger('delivery_id').references('id').inTable('deliveries');
    t.date('invoice_date').notNullable(); t.date('due_date').notNullable();
    t.string('status',20).notNullable().defaultTo('draft');
    t.decimal('subtotal',15,2).notNullable().defaultTo(0);
    t.decimal('tax_amount',15,2).notNullable().defaultTo(0);
    t.decimal('transport_charge',15,2).notNullable().defaultTo(0);
    t.decimal('advance_amount',15,2).notNullable().defaultTo(0);
    t.decimal('tds_amount',15,2).notNullable().defaultTo(0);
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.decimal('paid_amount',15,2).notNullable().defaultTo(0);
    t.decimal('balance_due',15,2).notNullable().defaultTo(0);
    t.string('irn_number',100); t.timestamp('irn_generated_at');
    t.text('notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('customer_id'); t.index('status'); t.index('due_date');
  });

  // invoice_items
  await knex.schema.createTable('invoice_items', t => {
    t.bigIncrements('id');
    t.bigInteger('invoice_id').notNullable().references('id').inTable('invoices').onDelete('CASCADE');
    t.bigInteger('sales_order_item_id').references('id').inTable('sales_order_items');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('qty',10,3).notNullable();
    t.decimal('unit_price',15,2).notNullable();
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('cgst_amount',15,2).notNullable().defaultTo(0);
    t.decimal('sgst_amount',15,2).notNullable().defaultTo(0);
    t.decimal('igst_amount',15,2).notNullable().defaultTo(0);
    t.decimal('discount_pct',5,2).notNullable().defaultTo(0);
    t.decimal('line_total',15,2).notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('invoice_id');
  });

  // credit_notes
  await knex.schema.createTable('credit_notes', t => {
    t.bigIncrements('id');
    t.string('cn_number',40).notNullable().unique();
    t.bigInteger('invoice_id').notNullable().references('id').inTable('invoices');
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.bigInteger('delivery_return_id');
    t.text('reason').notNullable();
    t.decimal('subtotal',15,2).notNullable().defaultTo(0);
    t.decimal('tax_amount',15,2).notNullable().defaultTo(0);
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.string('status',20).notNullable().defaultTo('draft');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('invoice_id'); t.index('customer_id');
  });

  // credit_note_items
  await knex.schema.createTable('credit_note_items', t => {
    t.bigIncrements('id');
    t.bigInteger('credit_note_id').notNullable().references('id').inTable('credit_notes').onDelete('CASCADE');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('qty',10,3).notNullable();
    t.decimal('unit_price',15,2).notNullable();
    t.decimal('gst_rate',5,2).notNullable().defaultTo(0);
    t.decimal('line_total',15,2).notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('credit_note_id');
  });

  // delivery_returns
  await knex.schema.createTable('delivery_returns', t => {
    t.bigIncrements('id');
    t.bigInteger('delivery_id').notNullable().references('id').inTable('deliveries');
    t.bigInteger('product_dimension_id').notNullable().references('id').inTable('product_dimensions');
    t.decimal('returned_qty',10,3).notNullable();
    t.text('reason').notNullable();
    t.string('condition',20).notNullable().defaultTo('unknown');
    t.string('stock_action',20).notNullable().defaultTo('pending');
    t.bigInteger('credit_note_id').references('id').inTable('credit_notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('received_by').notNullable();
    t.timestamps(true, true);
    t.index('delivery_id');
  });

  // Add FK from credit_notes to delivery_returns now that both tables exist
  await knex.schema.table('credit_notes', t => {
    t.foreign('delivery_return_id').references('id').inTable('delivery_returns');
  });

  // purchase_invoices
  await knex.schema.createTable('purchase_invoices', t => {
    t.bigIncrements('id');
    t.string('supplier_invoice_no',80).notNullable();
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.bigInteger('purchase_order_id').references('id').inTable('purchase_orders');
    t.date('invoice_date').notNullable(); t.date('due_date');
    t.decimal('total_amount',15,2).notNullable().defaultTo(0);
    t.decimal('paid_amount',15,2).notNullable().defaultTo(0);
    t.decimal('balance_due',15,2).notNullable().defaultTo(0);
    t.string('status',20).notNullable().defaultTo('unpaid');
    t.text('notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable(); t.bigInteger('updated_by');
    t.timestamps(true, true);
    t.index('supplier_id'); t.index('status');
  });

  // customer_payments (append-only)
  await knex.schema.createTable('customer_payments', t => {
    t.bigIncrements('id');
    t.bigInteger('invoice_id').notNullable().references('id').inTable('invoices');
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.date('payment_date').notNullable();
    t.decimal('amount',15,2).notNullable();
    t.string('mode',20).notNullable().defaultTo('cash');
    t.string('reference_number',100);
    t.string('cheque_number',50); t.string('cheque_bank',100); t.date('cheque_date');
    t.decimal('tds_amount',15,2).notNullable().defaultTo(0);
    t.text('notes');
    t.timestamp('reminder_sent_at'); t.string('reminder_channel',20);
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('invoice_id'); t.index('customer_id'); t.index('payment_date');
  });

  // supplier_payments (append-only)
  await knex.schema.createTable('supplier_payments', t => {
    t.bigIncrements('id');
    t.bigInteger('purchase_invoice_id').notNullable().references('id').inTable('purchase_invoices');
    t.bigInteger('supplier_id').notNullable().references('id').inTable('suppliers');
    t.date('payment_date').notNullable();
    t.decimal('amount',15,2).notNullable();
    t.string('mode',20).notNullable().defaultTo('neft');
    t.string('reference_number',100); t.text('notes');
    t.string('ip_address',100); t.string('mac_address',100);
    t.bigInteger('created_by').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('purchase_invoice_id'); t.index('supplier_id');
  });

  // customer_ledger (append-only)
  await knex.schema.createTable('customer_ledger', t => {
    t.bigIncrements('id');
    t.bigInteger('customer_id').notNullable().references('id').inTable('customers');
    t.date('txn_date').notNullable();
    t.string('txn_type',30).notNullable();
    t.string('ref_type',50); t.bigInteger('ref_id');
    t.decimal('debit',15,2).notNullable().defaultTo(0);
    t.decimal('credit',15,2).notNullable().defaultTo(0);
    t.decimal('balance',15,2).notNullable();
    t.string('description',255);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('customer_id'); t.index('txn_date');
  });

  // audit_logs (append-only)
  await knex.schema.createTable('audit_logs', t => {
    t.bigIncrements('id');
    t.bigInteger('user_id').references('id').inTable('auth_users');
    t.string('module',80).notNullable();
    t.string('action',30).notNullable();
    t.string('table_name',80).notNullable();
    t.bigInteger('record_id');
    t.jsonb('old_data'); t.jsonb('new_data');
    t.string('ip_address',45); t.string('mac_address',100); t.string('user_agent',300);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('user_id'); t.index('module'); t.index('action'); t.index('created_at');
  });

  // notifications
  await knex.schema.createTable('notifications', t => {
    t.bigIncrements('id');
    t.bigInteger('user_id').notNullable().references('id').inTable('auth_users');
    t.string('type',40).notNullable();
    t.string('title',200).notNullable();
    t.text('message').notNullable();
    t.string('ref_type',80); t.bigInteger('ref_id');
    t.integer('is_read').notNullable().defaultTo(0);
    t.timestamp('read_at');
    t.string('channel',20).notNullable().defaultTo('in_app');
    t.timestamp('sent_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('user_id'); t.index('is_read'); t.index('type');
  });
};

exports.down = async (knex) => {
  const tables = [
    'notifications','audit_logs','customer_ledger','supplier_payments','customer_payments',
    'purchase_invoices','delivery_returns','credit_note_items','credit_notes',
    'invoice_items','invoices','delivery_items','deliveries','route_groups','vehicles',
    'order_amendments','sales_order_items','sales_orders','quotation_items','quotations',
    'price_list_items','price_lists','customer_addresses','customers',
    'goods_receipt_items','goods_receipts','purchase_order_items','purchase_orders',
    'supplier_price_history','supplier_products','restock_cart_items','restock_cart',
    'stock_ledger','batch_lots','product_dimensions','products','suppliers','categories',
  ];
  for (const t of tables) await knex.schema.dropTableIfExists(t);
};
