// src/config/migrations/006_storefront_fields.js
// Storefront fields: product image + badge/tag, and per-variant color.
exports.up = async (knex) => {
  const add = async (table, col, cb) => {
    const has = await knex.schema.hasColumn(table, col);
    if (!has) await knex.schema.table(table, cb);
  };
  await add('products', 'image_url', t => t.string('image_url', 500));
  await add('products', 'badge',     t => t.string('badge', 40));        // e.g. "New", "Sale", "Bestseller"
  await add('product_dimensions', 'color', t => t.string('color', 60));  // variant colour
};

exports.down = async (knex) => {
  for (const [table, col] of [['products', 'image_url'], ['products', 'badge'], ['product_dimensions', 'color']]) {
    const has = await knex.schema.hasColumn(table, col);
    if (has) await knex.schema.table(table, t => t.dropColumn(col));
  }
};
