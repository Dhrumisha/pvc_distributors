// src/config/db.js
const knex    = require('knex');
const configs = require('./knexfile');
const logger  = require('./logger');

const env = process.env.NODE_ENV || 'development';
const cfg = configs[env];

const db = knex(cfg);

// Test connection on startup
db.raw('SELECT 1')
  .then(() => logger.info(`PostgreSQL connected [${env}] → ${cfg.connection.host}:${cfg.connection.port}/${cfg.connection.database}`))
  .catch(err => {
    logger.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = db;
