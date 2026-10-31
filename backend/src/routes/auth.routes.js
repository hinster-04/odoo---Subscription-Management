const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout } = require('../modules/auth/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = Router();

/**
 * Registration rate limiter
 *
 * 10 attempts per IP per 15 minutes.
 * Prevents brute-force account creation and enumeration attacks.
 * In production, consider tightening this further (e.g. 5 / hour).
 */
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for automated test requests (never set this in production)
  skip: (req) => process.env.NODE_ENV !== 'production' && req.headers['x-test-mode'] === 'true',
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again later.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Login rate limiter
 *
 * Configurable via LOGIN_RATE_LIMIT_MAX (defaults to 100 for dev/testing, production recommended: 5-10).
 * Guards against brute-force password guessing and credential stuffing.
 * Returns HTTP 429 when exceeded.
 */
const loginMaxAttempts = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '100', 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: loginMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for automated test requests (never set this in production)
  skip: (req) => process.env.NODE_ENV !== 'production' && req.headers['x-test-mode'] === 'true',
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again later.',
  },
  skipSuccessfulRequests: false,
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', registrationLimiter, register);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', loginLimiter, login);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticateToken, getMe);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', authenticateToken, logout);

module.exports = router;
