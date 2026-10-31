const plansService = require('./plans.service');

async function listPlans(req, res, next) {
  try {
    const {
      search,
      billing_frequency,
      is_active,
      product_id,
      sort_by,
      sort_order,
      page,
      limit
    } = req.query;

    const result = await plansService.getPlans({
      search,
      billing_frequency,
      is_active,
      product_id,
      sort_by,
      sort_order,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (err) {
    next(err);
  }
}

async function getPlan(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await plansService.getPlanById(id);
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
}

async function createPlan(req, res, next) {
  try {
    const newPlan = await plansService.createPlan(req.body);
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully.',
      data: newPlan
    });
  } catch (err) {
    next(err);
  }
}

async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await plansService.updatePlan(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function togglePlanStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const updated = await plansService.togglePlanStatus(id, is_active);
    res.status(200).json({
      success: true,
      message: `Plan status updated to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;
    const result = await plansService.deletePlan(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan
};
