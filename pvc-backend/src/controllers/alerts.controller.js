// src/controllers/alerts.controller.js
'use strict';
const { ok }  = require('../utils/response');
const AppError = require('../utils/AppError');
const emailService = require('../services/email.service');
const logger  = require('../config/logger');

const defaultConfig = {
  low_stock_channels:    ['in_app'],
  overdue_days:          0,
  cheque_reminder_days:  2,
  alert_cron_schedule:   '0 8 * * *',
};

exports.getConfig  = async (_req, res) => ok(res, { config: defaultConfig });
exports.updateConfig = async (req, res) => ok(res, { config: { ...defaultConfig, ...req.body } }, 'Config updated.');

// POST /api/v1/alerts/test
// Sends a real test email to verify SMTP is working.
// Body: { type: 'email', recipient: 'someone@email.com' }
exports.test = async (req, res) => {
  const { type = 'email', recipient } = req.body;

  if (type === 'email') {
    const to = recipient || req.user?.email;
    if (!to) throw new AppError('recipient email is required', 400);

    try {
      await emailService.sendTestEmail({ to });
      logger.info(`Test email sent to ${to} by user ${req.user?.id}`);
      return ok(res, { sent_to: to }, `✅ Test email sent to ${to}. Check your inbox (and spam folder).`);
    } catch (err) {
      throw new AppError(
        `Email failed: ${err.message}. Check SMTP_HOST / SMTP_USER / SMTP_PASS in your .env`,
        500
      );
    }
  }

  return ok(res, null, `Test notification sent via ${type}.`);
};
