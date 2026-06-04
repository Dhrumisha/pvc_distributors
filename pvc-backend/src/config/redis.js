// src/config/redis.js
const { createClient } = require('redis');
const logger = require('./logger');

let client = null;
// Once a connection attempt fails (or Redis is disabled), we stop trying so we
// don't flood logs or hang requests on every call. Permission caching simply
// falls back to the database — Redis is optional.
let disabled = process.env.REDIS_ENABLED === 'false' || process.env.REDIS_DISABLED === 'true';

async function getRedis() {
  if (disabled) return null;
  if (client && client.isOpen) return client;

  const c = createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      // Fail fast instead of retrying forever when Redis isn't running.
      connectTimeout: 2000,
      reconnectStrategy: false,
    },
    password : process.env.REDIS_PASSWORD || undefined,
    database : parseInt(process.env.REDIS_DB || '0'),
  });

  // Swallow async errors so an unavailable Redis never crashes the process.
  c.on('error', () => {});

  try {
    await c.connect();
    client = c;
    logger.info('Redis connected — permission caching enabled');
    return client;
  } catch (err) {
    disabled = true;
    client = null;
    logger.warn(`Redis not available — permission caching disabled (DB fallback active): ${err.message}`);
    try { await c.disconnect(); } catch { /* ignore */ }
    return null;
  }
}

module.exports = { getRedis };
