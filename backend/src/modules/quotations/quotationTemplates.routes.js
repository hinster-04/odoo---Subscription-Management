const express = require('express');
const templatesController = require('./quotationTemplates.controller');
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

router.get('/', templatesController.listTemplates);
router.get('/:id', templatesController.getTemplate);
router.post('/', resolveAuthContext, templatesController.createTemplate);
router.put('/:id', templatesController.updateTemplate);
router.patch('/:id/status', templatesController.toggleTemplateStatus);
router.delete('/:id', templatesController.deleteTemplate);

module.exports = router;
