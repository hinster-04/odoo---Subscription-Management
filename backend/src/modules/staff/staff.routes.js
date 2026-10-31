const express = require('express');
const staffController = require('./staff.controller');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const router = express.Router();

/**
 * Token resolution middleware
 * If a Bearer token is provided in Authorization header, validates it and attaches req.user.
 */
const resolveAuthContext = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload && payload.sub) {
        const account = await prisma.auth.findUnique({
          where: { id: payload.sub },
          select: { id: true, role: true, is_active: true }
        });
        if (account) {
          req.user = account;
        }
      }
    } catch (err) {
      // Token expired or invalid
    }
  }
  next();
};

router.get('/meta/summary', staffController.getMetadata);
router.get('/', staffController.listStaff);
router.get('/:id', staffController.getStaff);
router.post('/', resolveAuthContext, staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.patch('/:id/status', staffController.toggleStaffStatus);

module.exports = router;
