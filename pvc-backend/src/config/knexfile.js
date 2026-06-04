// src/config/knexfile.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Knex configuration for PostgreSQL.
 * Uses environment variables so no credentials are hardcoded.
 * Supports development, test, and production environments.
 */
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host    : process.env.DB_HOST     || '127.0.0.1',
      port    : parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'pvc_admin',
      user    : process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl     : process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    debug: process.env.DB_DEBUG === 'true',
  },

  test: {
    client: 'pg',
    connection: {
      host    : process.env.DB_HOST     || '127.0.0.1',
      port    : parseInt(process.env.DB_PORT || '5432'),
      database: (process.env.DB_NAME    || 'pvc_admin') + '_test',
      user    : process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    pool: { min: 1, max: 5 },
    migrations: { directory: './migrations', tableName: 'knex_migrations' },
    seeds:      { directory: './seeds' },
  },

  production: {
    client: 'pg',
    connection: {
      host    : process.env.DB_HOST,
      port    : parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user    : process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl     : { rejectUnauthorized: false },
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis:    10000,
    },
    migrations: { directory: './migrations', tableName: 'knex_migrations' },
  },
};
