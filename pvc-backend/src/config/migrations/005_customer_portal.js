// src/config/migrations/005_customer_portal.js
// Customer-facing portal: customer login, per-customer discount override,
// portal approval status, and per-type default discounts.
exports.up = async (knex) => {
  // ── customers: portal columns ──
  const addCol = async (col, cb) => {
    const has = await knex.schema.hasColumn('customers', col);
    if (!has) await knex.schema.table('customers', cb);
  };
  await addCol('password_hash',    t => t.string('password_hash', 255));
  await addCol('discount_percent', t => t.decimal('discount_percent', 5, 2));            // per-customer override (nullable → use type default)
  await addCol('portal_status',    t => t.string('portal_status', 20).notNullable().defaultTo('none')); // none | pending | approved
  await addCol('portal_last_login_at', t => t.timestamp('portal_last_login_at'));

  // ── per-type default discounts ──
  const hasTable = await knex.schema.hasTable('customer_type_discounts');
  if (!hasTable) {
    await knex.schema.createTable('customer_type_discounts', (t) => {
      t.string('customer_type', 40).primary();
      t.string('label', 60).notNullable();
      t.decimal('discount_percent', 5, 2).notNullable().defaultTo(0);
      t.boolean('credit_allowed').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
    await knex('customer_type_discounts').insert([
      { customer_type: 'retail',      label: 'Retail',      discount_percent: 0,  credit_allowed: false, created_at: new Date(), updated_at: new Date() },
      { customer_type: 'wholesale_a', label: 'Wholesale A', discount_percent: 8,  credit_allowed: true,  created_at: new Date(), updated_at: new Date() },
      { customer_type: 'wholesale_b', label: 'Wholesale B', discount_percent: 12, credit_allowed: true,  created_at: new Date(), updated_at: new Date() },
      { customer_type: 'custom',      label: 'Custom',      discount_percent: 5,  credit_allowed: true,  created_at: new Date(), updated_at: new Date() },
    ]);
  }
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('customer_type_discounts');
  for (const col of ['password_hash', 'discount_percent', 'portal_status', 'portal_last_login_at']) {
    const has = await knex.schema.hasColumn('customers', col);
    if (has) await knex.schema.table('customers', t => t.dropColumn(col));
  }
};
