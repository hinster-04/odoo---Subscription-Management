require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.routes');
const authRouter  = require('./routes/auth.routes');
const testRouter  = require('./routes/test.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production, replace the origin with your actual frontend domain
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') ?? []
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // guard against oversized payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth',   authRouter);

// DEV ONLY — remove before production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRouter);
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
