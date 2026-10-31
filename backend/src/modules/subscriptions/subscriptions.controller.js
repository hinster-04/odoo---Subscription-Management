const subscriptionsService = require('./subscriptions.service');

async function listSubscriptions(req, res, next) {
  try {
    const {
      search,
      status,
      billing_frequency,
      customer_id,
      sort_by,
      sort_order,
      page,
      limit
    } = req.query;

    const result = await subscriptionsService.getSubscriptions({
      search,
      status,
      billing_frequency,
      customer_id,
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

async function getSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const subscription = await subscriptionsService.getSubscriptionById(id);
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    next(err);
  }
}

async function createSubscription(req, res, next) {
  try {
    const creatorAuthId = req.user ? req.user.id : null;
    const newSubscription = await subscriptionsService.createSubscription(req.body, creatorAuthId);
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully.',
      data: newSubscription
    });
  } catch (err) {
    next(err);
  }
}

async function updateSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await subscriptionsService.updateSubscription(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function updateSubscriptionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await subscriptionsService.updateSubscriptionStatus(id, status);
    res.status(200).json({
      success: true,
      message: `Subscription status updated to ${status}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const result = await subscriptionsService.deleteSubscription(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription
};
