/**
 * DEVELOPMENT / TESTING ENDPOINTS ONLY
 *
 * These routes exist to verify JWT auth and role-based access during Phase 1.
 * They MUST be removed or disabled before production deployment.
 *
 * Endpoints:
 *   GET /api/test/protected  — any authenticated user
 *   GET /api/test/admin      — admin role only
 *   GET /api/test/staff      — staff role only
 *   GET /api/test/customer   — customer role only
 */

const { Router } = require('express');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

const router = Router();

// ── Protected (any authenticated role) ──────────────────────────────────────
router.get('/protected', authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'You are authenticated',
    user: {
      id: req.user.id,
      role: req.user.role,
      profileId: req.user.profileId,
    },
  });
});

// ── Admin only ───────────────────────────────────────────────────────────────
router.get('/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin access confirmed',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// ── Staff only ───────────────────────────────────────────────────────────────
router.get('/staff', authenticateToken, authorizeRoles('staff'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Staff access confirmed',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

// ── Customer only ─────────────────────────────────────────────────────────────
router.get('/customer', authenticateToken, authorizeRoles('customer'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Customer access confirmed',
    user: {
      id: req.user.id,
      role: req.user.role,
    },
  });
});

module.exports = router;
