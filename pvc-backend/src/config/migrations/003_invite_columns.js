// src/config/migrations/003_invite_columns.js
// Adds invite token + must_set_password columns to auth_users.
// Run: npm run migrate
exports.up = async (knex) => {
  await knex.schema.table('auth_users', (t) => {
    t.string('invite_token',         100).nullable();
    t.timestamp('invite_token_expires').nullable();
    t.boolean('must_set_password').notNullable().defaultTo(false);
  });
};

exports.down = async (knex) => {
  await knex.schema.table('auth_users', (t) => {
    t.dropColumn('invite_token');
    t.dropColumn('invite_token_expires');
    t.dropColumn('must_set_password');
  });
};
