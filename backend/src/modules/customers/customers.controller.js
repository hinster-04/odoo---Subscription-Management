const customersService = require('./customers.service');

async function listCustomers(req, res, next) {
  try {
    const result = await customersService.getCustomers(req.query);
    res.status(200).json({
      status: 'success',
      data: result.items,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getCustomer(req, res, next) {
  try {
    const customer = await customersService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found.'
      });
    }
    res.status(200).json({
      status: 'success',
      data: customer
    });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const updated = await customersService.updateCustomer(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Customer profile updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function toggleCustomerStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'is_active boolean is required.'
      });
    }
    const result = await customersService.setCustomerStatus(req.params.id, is_active);
    res.status(200).json({
      status: 'success',
      message: `Customer account ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getMetadata(req, res, next) {
  try {
    const meta = await customersService.getCustomerMetadata();
    res.status(200).json({
      status: 'success',
      data: meta
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCustomers,
  getCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getMetadata
};
