const express = require('express');
const quotationsController = require('./quotations.controller');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const router = express.Router();

// Optional auth context resolver
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
      // Ignored if expired/invalid
    }
  }
  next();
};

router.get('/', quotationsController.listQuotations);
router.get('/:id', quotationsController.getQuotation);
router.post('/', resolveAuthContext, quotationsController.createQuotation);
router.put('/:id', quotationsController.updateQuotation);
router.patch('/:id/status', quotationsController.updateQuotationStatus);
router.post('/:id/convert-to-subscription', resolveAuthContext, quotationsController.convertToSubscription);
router.delete('/:id', quotationsController.deleteQuotation);

module.exports = router;
