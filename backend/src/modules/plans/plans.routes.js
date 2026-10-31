const express = require('express');
const plansController = require('./plans.controller');

const router = express.Router();

router.get('/', plansController.listPlans);
router.get('/:id', plansController.getPlan);
router.post('/', plansController.createPlan);
router.put('/:id', plansController.updatePlan);
router.patch('/:id/status', plansController.togglePlanStatus);
router.delete('/:id', plansController.deletePlan);

module.exports = router;
