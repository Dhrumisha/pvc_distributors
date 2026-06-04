// src/config/migrations/001_rbac.js
exports.up = async (knex) => {
  // auth_users
  await knex.schema.createTable('auth_users', t => {
    t.bigIncrements('id').primary();
    t.string('name',100).notNullable();
    t.string('email',150).notNullable().unique();
    t.string('phone',20);
    t.string('password_hash',255).notNullable();
    t.integer('is_active').notNullable().defaultTo(1);
    t.timestamp('last_login_at');
    t.string('avatar_url',500);
    t.string('password_reset_token',100);
    t.timestamp('password_reset_expires');
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.string('ip_address',100);
    t.string('mac_address',100);
    t.bigInteger('created_by');
    t.timestamps(true, true);
    t.timestamp('deleted_at');
  });

  // auth_roles
  await knex.schema.createTable('auth_roles', t => {
    t.bigIncrements('id').primary();
    t.string('name',80).notNullable().unique();
    t.string('slug',80).notNullable().unique();
    t.text('description');
    t.integer('is_system').notNullable().defaultTo(0);
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.string('ip_address',100);
    t.string('mac_address',100);
    t.bigInteger('created_by');
    t.timestamps(true, true);
  });

  // auth_modules
  await knex.schema.createTable('auth_modules', t => {
    t.bigIncrements('id').primary();
    t.string('code',60).notNullable().unique();
    t.string('label',100).notNullable();
    t.text('description');
    t.integer('sort_order').notNullable().defaultTo(0);
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.timestamps(true, true);
  });

  // auth_module_actions
  await knex.schema.createTable('auth_module_actions', t => {
    t.bigIncrements('id').primary();
    t.bigInteger('module_id').notNullable().references('id').inTable('auth_modules').onDelete('CASCADE');
    t.string('action',60).notNullable();
    t.string('label',100).notNullable();
    t.text('description');
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.timestamps(true, true);
    t.unique(['module_id','action']);
  });

  // auth_permissions
  await knex.schema.createTable('auth_permissions', t => {
    t.bigIncrements('id').primary();
    t.string('resource',100);
    t.string('action',60);
    t.string('status',20).notNullable().defaultTo('ACTIVE');
    t.string('ip_address',100);
    t.string('mac_address',100);
    t.bigInteger('created_by');
    t.timestamps(true, true);
  });

  // auth_roles_permissions_mapping
  await knex.schema.createTable('auth_roles_permissions_mapping', t => {
    t.bigIncrements('id').primary();
    t.bigInteger('role_id').notNullable().references('id').inTable('auth_roles').onDelete('CASCADE');
    t.bigInteger('permission_id').notNullable().references('id').inTable('auth_permissions').onDelete('CASCADE');
    t.bigInteger('module_action_id').notNullable().references('id').inTable('auth_module_actions').onDelete('CASCADE');
    t.bigInteger('granted_by').references('id').inTable('auth_users');
    t.string('ip_address',100);
    t.string('mac_address',100);
    t.bigInteger('created_by');
    t.timestamps(true, true);
    t.unique(['role_id','permission_id']);
    t.index('permission_id');
    t.index('role_id');
    t.index('module_action_id');
  });

  // auth_user_roles
  await knex.schema.createTable('auth_user_roles', t => {
    t.bigIncrements('id').primary();
    t.bigInteger('user_id').notNullable().references('id').inTable('auth_users').onDelete('CASCADE');
    t.bigInteger('role_id').notNullable().references('id').inTable('auth_roles').onDelete('CASCADE');
    t.bigInteger('assigned_by').references('id').inTable('auth_users');
    t.timestamp('expires_at');
    t.string('ip_address',100);
    t.string('mac_address',100);
    t.bigInteger('created_by');
    t.timestamps(true, true);
    t.unique(['user_id','role_id']);
    t.index('user_id');
    t.index('role_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('auth_user_roles');
  await knex.schema.dropTableIfExists('auth_roles_permissions_mapping');
  await knex.schema.dropTableIfExists('auth_permissions');
  await knex.schema.dropTableIfExists('auth_module_actions');
  await knex.schema.dropTableIfExists('auth_modules');
  await knex.schema.dropTableIfExists('auth_roles');
  await knex.schema.dropTableIfExists('auth_users');
};
