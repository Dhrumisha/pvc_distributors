// src/config/migrations/004_enquiries.js
// Leads/enquiries captured from the public marketing website.
exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('enquiries');
  if (exists) return;
  await knex.schema.createTable('enquiries', (t) => {
    t.bigIncrements('id').primary();
    t.string('name', 150).notNullable();
    t.string('email', 150);
    t.string('phone', 30);
    t.string('company', 150);
    t.string('subject', 200);
    t.text('message');
    t.string('type', 20).notNullable().defaultTo('contact');   // contact | quote
    t.string('product_interest', 200);
    t.string('status', 20).notNullable().defaultTo('new');      // new | contacted | converted | closed
    t.string('source', 50).notNullable().defaultTo('website');
    t.string('ip_address', 100);
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('enquiries');
};
