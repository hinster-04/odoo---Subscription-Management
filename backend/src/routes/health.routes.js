const { Router } = require('express');
const prisma = require('../config/database');

const router = Router();

/**
 * GET /api/health
 *
 * Verifies database connectivity and returns service status.
 * Safe: never exposes credentials or connection strings.
 */
router.get('/', async (req, res, next) => {
  try {
    // Lightweight query — just proves Prisma can reach the DB
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: 'Brightloop backend is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
