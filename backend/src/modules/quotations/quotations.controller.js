const quotationsService = require('./quotations.service');

async function listQuotations(req, res, next) {
  try {
    const {
      search,
      status,
      customer_id,
      sort_by,
      sort_order,
      page,
      limit
    } = req.query;

    const result = await quotationsService.getQuotations({
      search,
      status,
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

async function getQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await quotationsService.getQuotationById(id);
    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (err) {
    next(err);
  }
}

async function createQuotation(req, res, next) {
  try {
    const creatorAuthId = req.user ? req.user.id : null;
    const newQuotation = await quotationsService.createQuotation(req.body, creatorAuthId);
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully.',
      data: newQuotation
    });
  } catch (err) {
    next(err);
  }
}

async function updateQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await quotationsService.updateQuotation(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function updateQuotationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await quotationsService.updateQuotationStatus(id, status);
    res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function convertToSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const creatorAuthId = req.user ? req.user.id : null;
    const result = await quotationsService.convertQuotationToSubscription(id, creatorAuthId);
    res.status(200).json({
      success: true,
      message: result.alreadyConverted
        ? 'Quotation was already converted to a subscription.'
        : 'Quotation converted to subscription successfully.',
      data: result.subscription
    });
  } catch (err) {
    next(err);
  }
}

async function deleteQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const result = await quotationsService.deleteQuotation(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertToSubscription,
  deleteQuotation
};
