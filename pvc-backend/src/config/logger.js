// src/config/logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) =>
  `${timestamp} [${level}]: ${stack || message}`
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), logFormat),
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
    }),
  ],
});

module.exports = logger;
