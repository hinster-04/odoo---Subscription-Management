const express = require('express');
const subscriptionsController = require('./subscriptions.controller');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const router = express.Router();

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
      // Ignored
    }
  }
  next();
};

router.get('/', subscriptionsController.listSubscriptions);
router.get('/:id', subscriptionsController.getSubscription);
router.post('/', resolveAuthContext, subscriptionsController.createSubscription);
router.put('/:id', subscriptionsController.updateSubscription);
router.patch('/:id/status', subscriptionsController.updateSubscriptionStatus);
router.delete('/:id', subscriptionsController.deleteSubscription);

module.exports = router;
