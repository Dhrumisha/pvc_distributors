// src/app.js
require('dotenv').config();
require('express-async-errors');

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const logger       = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ── HTTP logging ──────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: msg => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '200'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please slow down.' },
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
const v1 = require('./routes');
app.use('/api/v1', v1);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
