// src/services/email.service.js
// ─────────────────────────────────────────────────────────────────────────────
// Nodemailer email service — sends real emails to real inboxes.
//
// When you set SMTP_USER=yourname@gmail.com and SMTP_PASS=<App Password>
// the email goes FROM your Gmail TO the recipient's actual inbox —
// whether that's Gmail, Yahoo, Outlook, or any email address.
//
// SETUP (Gmail — 3 steps):
//   1. Enable 2-Step Verification on your Google Account
//      → https://myaccount.google.com/security
//   2. Create an App Password:
//      → Google Account → Security → 2-Step Verification → App passwords
//      → Select "Mail" + "Other device" → name it "PVC Admin" → Generate
//      → Copy the 16-character password (no spaces)
//   3. Set in .env:
//      SMTP_USER=yourname@gmail.com
//      SMTP_PASS=abcd efgh ijkl mnop   (16 chars, spaces OK)
//      MAIL_FROM_ADDRESS=yourname@gmail.com
//      FRONTEND_URL=http://your-frontend.com
//
// The email will arrive in the RECIPIENT's inbox, sent from your Gmail.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

// ── Build transporter from env vars (called fresh each time to pick up changes) ─
function createTransporter() {
  const host   = process.env.SMTP_HOST   || 'smtp.gmail.com';
  const port   = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true'; // true only for port 465
  const user   = process.env.SMTP_USER;
  const pass   = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warn('[Email] SMTP_USER or SMTP_PASS not set — emails will NOT be sent.');
    logger.warn('[Email] Set these in your .env file to enable email sending.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,                  // false = STARTTLS (port 587), true = SSL (port 465)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    // Retry failed sends up to 3 times
    pool:           true,
    maxConnections: 3,
    maxMessages:    100,
  });
}

// ── Verify SMTP connection (called at startup) ──────────────────────────────
async function verifyConnection() {
  const t = createTransporter();
  if (!t) return false;
  try {
    await t.verify();
    logger.info(`[Email] SMTP connected ✓  host=${process.env.SMTP_HOST}  user=${process.env.SMTP_USER}`);
    return true;
  } catch (err) {
    logger.error(`[Email] SMTP connection FAILED: ${err.message}`);
    logger.error('[Email] Common fixes:');
    logger.error('[Email]   Gmail: Use an App Password, not your regular password');
    logger.error('[Email]   Gmail: Enable 2-Step Verification first');
    logger.error('[Email]   Gmail: Allow less secure apps OR use App Passwords');
    logger.error(`[Email]   Check: SMTP_HOST=${process.env.SMTP_HOST} SMTP_PORT=${process.env.SMTP_PORT} SMTP_USER=${process.env.SMTP_USER}`);
    return false;
  }
}

// ── Core send function ──────────────────────────────────────────────────────
async function sendMail({ to, subject, html, text }) {
  const transporter = createTransporter();

  if (!transporter) {
    logger.error(`[Email] SKIPPED (no SMTP config): To=${to} Subject="${subject}"`);
    throw new Error('Email service not configured. Set SMTP_USER and SMTP_PASS in .env');
  }

  const from = `"${process.env.MAIL_FROM_NAME || 'PVC Admin'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`;

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    logger.info(`[Email] SENT ✓  To=${to}  Subject="${subject}"  MessageId=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[Email] FAILED ✗  To=${to}  Subject="${subject}"  Error=${err.message}`);

    // Helpful hints in the log based on error type
    if (err.message.includes('Invalid login') || err.message.includes('Username and Password')) {
      logger.error('[Email] FIX: Gmail rejects regular passwords. You must use a 16-char App Password.');
      logger.error('[Email] Get one at: https://myaccount.google.com/apppasswords');
    }
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      logger.error(`[Email] FIX: Cannot reach SMTP server. Check SMTP_HOST and SMTP_PORT in .env`);
    }
    if (err.message.includes('self signed') || err.message.includes('certificate')) {
      logger.error('[Email] FIX: TLS certificate error. Set NODE_ENV=development or check your SMTP host.');
    }

    throw err;
  }
}

// ── Shared dark-themed HTML wrapper ────────────────────────────────────────
function wrapHtml({ title, preheader = '', body }) {
  const appName    = process.env.MAIL_FROM_NAME  || 'PVC Admin';
  const appUrl     = process.env.FRONTEND_URL    || 'http://localhost:3000';
  const year       = new Date().getFullYear();
  const fromEmail  = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
    body{margin:0!important;padding:0!important;background-color:#0f1117}
  </style>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0f1117;line-height:1px;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f1117;padding:40px 16px;">
    <tr><td align="center">
    
    <!-- Card -->
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#181c27;border-radius:14px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
      
      <!-- Header -->
      <tr>
        <td style="background:#13161e;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:38px;height:38px;background:#f59e0b;border-radius:10px;text-align:center;vertical-align:middle;">
                <span style="font-size:18px;line-height:38px;">📦</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <div style="font-size:15px;font-weight:700;color:#e8ecf4;line-height:1.2;">${escapeHtml(appName)}</div>
                <div style="font-size:11px;color:#5a6285;font-weight:500;">Distributor Management System</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td style="padding:32px 28px;">
          ${body}
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background:#13161e;padding:18px 28px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:12px;color:#3d4466;">© ${year} ${escapeHtml(appName)}&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${appUrl}" style="color:#5a6285;text-decoration:none;">${appUrl}</a></p>
          <p style="margin:6px 0 0;font-size:11px;color:#2e3450;">This is an automated message from ${escapeHtml(fromEmail)}. Do not reply.</p>
        </td>
      </tr>
      
    </table><!-- /Card -->
    </td></tr>
  </table><!-- /Outer -->
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function btn(label, url) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr><td style="background:#f59e0b;border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:13px 28px;color:#0a0c10;font-weight:700;font-size:14px;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${label} →</a>
    </td></tr>
  </table>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#5a6285;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#e8ecf4;font-weight:600;text-align:right;font-family:'Courier New',monospace;">${escapeHtml(value)}</td>
  </tr>`;
}

function infoBox(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#13161e;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:4px 16px;margin:16px 0;">
    ${rows}
  </table>`;
}

function warningBox(text) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
    <tr><td style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:12px 16px;font-size:13px;color:#ef4444;line-height:1.5;">
      ⚠&nbsp; ${text}
    </td></tr>
  </table>`;
}

// ────────────────────────────────────────────────────────────────────────────
//  EMAIL 1 — FORGOT PASSWORD RESET
//  Recipient: the user who requested a reset
//  The link goes to /auth/reset-password?token=TOKEN
// ────────────────────────────────────────────────────────────────────────────
async function sendPasswordReset({ to, name, token }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl    = `${frontendUrl}/auth/reset-password?token=${token}`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e8ecf4;letter-spacing:-0.02em;">Reset your password</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">Hi ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">
      We received a request to reset the password for your <strong style="color:#e8ecf4;">PVC Admin</strong> account.
      Click the button below to choose a new password.
    </p>
    ${btn('Reset My Password', resetUrl)}
    ${infoBox(
      infoRow('Account', to) +
      infoRow('Link expires in', '1 hour') +
      infoRow('Requested at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')
    )}
    ${warningBox("If you didn't request a password reset, you can safely ignore this email. Your password will <strong>not</strong> change.")}
    <p style="margin:20px 0 0;font-size:12px;color:#3d4466;word-break:break-all;">
      Button not working? Paste this URL in your browser:<br/>
      <a href="${resetUrl}" style="color:#5a6285;">${resetUrl}</a>
    </p>`;

  const text = `Hi ${name || 'there'},\n\nReset your PVC Admin password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`;

  return sendMail({
    to,
    subject: '🔐 Reset your PVC Admin password',
    html:    wrapHtml({ title: 'Reset your PVC Admin password', preheader: 'Click to reset your PVC Admin password. Link expires in 1 hour.', body }),
    text,
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  EMAIL 2 — NEW USER INVITE
//  Recipient: the newly created user
//  The link goes to /auth/set-password?token=TOKEN
// ────────────────────────────────────────────────────────────────────────────
async function sendInvite({ to, name, invitedBy, roles = [], token }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const setPassUrl  = `${frontendUrl}/auth/set-password?token=${token}`;
  const roleList    = roles.length ? roles.join(', ') : 'Staff';

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e8ecf4;letter-spacing:-0.02em;">You're invited! 🎉</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">
      <strong style="color:#e8ecf4;">${escapeHtml(invitedBy)}</strong> has created an account for you on
      <strong style="color:#e8ecf4;">PVC Admin</strong> — the distributor management system.
      Click below to set your password and activate your account.
    </p>
    ${btn('Set My Password & Get Started', setPassUrl)}
    ${infoBox(
      infoRow('Your email', to) +
      infoRow('Role assigned', roleList) +
      infoRow('Invited by', invitedBy) +
      infoRow('Link expires in', '48 hours')
    )}
    <p style="margin:16px 0;font-size:13px;color:#a0aabf;line-height:1.6;">
      Once you set your password, you can sign in at
      <a href="${escapeHtml(process.env.FRONTEND_URL || '')}/auth/login" style="color:#f59e0b;text-decoration:none;">PVC Admin</a>
      using this email address (<strong style="color:#e8ecf4;">${escapeHtml(to)}</strong>).
    </p>
    ${warningBox('This invite link can only be used once and expires in 48 hours. If it expires, contact your administrator to resend.')}
    <p style="margin:20px 0 0;font-size:12px;color:#3d4466;word-break:break-all;">
      Button not working? Paste this in your browser:<br/>
      <a href="${setPassUrl}" style="color:#5a6285;">${setPassUrl}</a>
    </p>`;

  const text = `Hi ${name},\n\n${invitedBy} has invited you to PVC Admin.\n\nSet your password at:\n${setPassUrl}\n\nYour email: ${to}\nRole: ${roleList}\nLink expires in: 48 hours\n\nOnce set, sign in at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login`;

  return sendMail({
    to,
    subject: `🎉 You've been invited to PVC Admin`,
    html:    wrapHtml({ title: "You're invited to PVC Admin", preheader: `${invitedBy} invited you to PVC Admin. Click to set your password and get started.`, body }),
    text,
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  EMAIL 3 — RESEND INVITE (fresh link)
// ────────────────────────────────────────────────────────────────────────────
async function resendInvite({ to, name, invitedBy, roles = [], token }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const setPassUrl  = `${frontendUrl}/auth/set-password?token=${token}`;
  const roleList    = roles.length ? roles.join(', ') : 'Staff';

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e8ecf4;letter-spacing:-0.02em;">New invite link</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">
      A new invite link has been generated for your <strong style="color:#e8ecf4;">PVC Admin</strong>
      account by <strong style="color:#e8ecf4;">${escapeHtml(invitedBy)}</strong>.
      Your previous link has been invalidated.
    </p>
    ${btn('Set My Password', setPassUrl)}
    ${infoBox(
      infoRow('Your email', to) +
      infoRow('Role', roleList) +
      infoRow('New link expires in', '48 hours')
    )}
    <p style="margin:20px 0 0;font-size:12px;color:#3d4466;word-break:break-all;">
      Button not working? Paste in your browser:<br/>
      <a href="${setPassUrl}" style="color:#5a6285;">${setPassUrl}</a>
    </p>`;

  const text = `Hi ${name},\n\nA new PVC Admin invite link:\n${setPassUrl}\n\nExpires in 48 hours.`;

  return sendMail({
    to,
    subject: '🔗 New invite link — PVC Admin',
    html:    wrapHtml({ title: 'New PVC Admin invite link', preheader: 'A new set-password link has been generated for your PVC Admin account.', body }),
    text,
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  EMAIL 4 — PASSWORD CHANGED CONFIRMATION
//  Sent after: reset-password, set-password, change-password
// ────────────────────────────────────────────────────────────────────────────
async function sendPasswordChangedNotice({ to, name }) {
  const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl     = `${frontendUrl}/auth/forgot-password`;
  const timeStr      = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e8ecf4;letter-spacing:-0.02em;">Password changed ✓</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">Hi ${escapeHtml(name || 'there')},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">
      Your <strong style="color:#e8ecf4;">PVC Admin</strong> password was successfully changed.
      If you made this change, no action is needed.
    </p>
    ${infoBox(
      infoRow('Account', to) +
      infoRow('Changed at', timeStr)
    )}
    ${warningBox(`If you did <strong>not</strong> change your password, your account may be compromised. <a href="${resetUrl}" style="color:#f59e0b;text-decoration:none;">Reset it immediately</a> or contact your administrator.`)}`;

  const text = `Hi ${name},\n\nYour PVC Admin password was changed at ${timeStr}.\n\nIf you didn't do this, reset your password at:\n${resetUrl}`;

  return sendMail({
    to,
    subject: '🔒 Your PVC Admin password was changed',
    html:    wrapHtml({ title: 'Your PVC Admin password was changed', preheader: 'Your PVC Admin password was successfully changed.', body }),
    text,
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  EMAIL 5 — TEST EMAIL (called from admin panel to verify SMTP works)
// ────────────────────────────────────────────────────────────────────────────
async function sendTestEmail({ to }) {
  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
  const smtpInfo = `${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${process.env.SMTP_USER}`;

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e8ecf4;letter-spacing:-0.02em;">✅ Email is working!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#a0aabf;line-height:1.6;">
      This is a test email from your <strong style="color:#e8ecf4;">PVC Admin</strong> system.
      If you're reading this, your SMTP configuration is correct and emails will be delivered to real inboxes.
    </p>
    ${infoBox(
      infoRow('Sent to', to) +
      infoRow('SMTP host', smtpInfo) +
      infoRow('Sent at', timeStr)
    )}
    <p style="margin:16px 0;font-size:13px;color:#a0aabf;line-height:1.6;">
      All transactional emails (forgot password, user invites, password change confirmations) will be delivered the same way.
    </p>`;

  const text = `PVC Admin SMTP test\n\nSent to: ${to}\nSMTP: ${smtpInfo}\nSent at: ${timeStr}\n\nYour email configuration is working correctly.`;

  return sendMail({
    to,
    subject: '✅ PVC Admin — Email test successful',
    html:    wrapHtml({ title: 'PVC Admin email test', preheader: 'Your PVC Admin SMTP configuration is working correctly.', body }),
    text,
  });
}

module.exports = {
  verifyConnection,
  sendPasswordReset,
  sendInvite,
  resendInvite,
  sendPasswordChangedNotice,
  sendTestEmail,
};
