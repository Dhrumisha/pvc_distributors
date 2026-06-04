// src/server.js
'use strict';
require('dotenv').config();

const app    = require('./app');
const logger = require('./config/logger');
const crons  = require('./utils/crons');
const emailService = require('./services/email.service');

const PORT = parseInt(process.env.PORT || '4000');

const server = app.listen(PORT, async () => {
  logger.info(`══════════════════════════════════════════════════`);
  logger.info(` PVC Admin API  ·  port ${PORT}  ·  ${process.env.NODE_ENV || 'development'}`);
  logger.info(`══════════════════════════════════════════════════`);
  logger.info(` Health : http://localhost:${PORT}/health`);
  logger.info(` API    : http://localhost:${PORT}/api/v1`);
  logger.info(`──────────────────────────────────────────────────`);

  // Verify SMTP on startup so you know immediately if email is broken
  logger.info(' Checking SMTP connection...');
  const smtpOk = await emailService.verifyConnection();
  if (!smtpOk) {
    logger.warn(' ⚠ SMTP not connected — forgot-password & invite emails will NOT work.');
    logger.warn(' ⚠ Set SMTP_USER + SMTP_PASS in your .env file.');
    logger.warn(' ⚠ See .env.example for Gmail setup instructions.');
  } else {
    logger.info(` ✓ SMTP ready — emails will be sent via ${process.env.SMTP_HOST}`);
  }

  logger.info(`──────────────────────────────────────────────────`);
  logger.info(` Starting scheduled jobs...`);
  crons.init();
  logger.info(`══════════════════════════════════════════════════\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => { logger.info('HTTP server closed'); process.exit(0); });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  err => { logger.error('Uncaught exception:', err);  process.exit(1); });
process.on('unhandledRejection', err => { logger.error('Unhandled rejection:', err); });

module.exports = server;
