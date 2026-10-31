const staffService = require('./staff.service');

async function listStaff(req, res, next) {
  try {
    const result = await staffService.getStaff(req.query);
    res.status(200).json({
      status: 'success',
      data: result.items,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getStaff(req, res, next) {
  try {
    const member = await staffService.getStaffById(req.params.id);
    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Staff member not found.'
      });
    }
    res.status(200).json({
      status: 'success',
      data: member
    });
  } catch (err) {
    next(err);
  }
}

async function createStaff(req, res, next) {
  try {
    // Enforce authorization on the backend:
    // If request has an authenticated user context and its role is not admin, strictly forbid!
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: Only an authorized Administrator can create staff accounts. Staff members are not permitted to create other staff accounts.'
      });
    }

    const newStaff = await staffService.createStaff(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Staff account created successfully.',
      data: newStaff
    });
  } catch (err) {
    next(err);
  }
}

async function updateStaff(req, res, next) {
  try {
    const updated = await staffService.updateStaff(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Staff member details updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function toggleStaffStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'is_active boolean is required.'
      });
    }
    const result = await staffService.setStaffStatus(req.params.id, is_active);
    res.status(200).json({
      status: 'success',
      message: `Staff account ${result.is_active ? 'activated' : 'deactivated'} successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getMetadata(req, res, next) {
  try {
    const meta = await staffService.getStaffMetadata();
    res.status(200).json({
      status: 'success',
      data: meta
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  getMetadata
};
