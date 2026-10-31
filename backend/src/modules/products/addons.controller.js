const addonsService = require('./addons.service');

async function listAddons(req, res, next) {
  try {
    const addons = await addonsService.getAddonsByProductId(req.params.productId);
    res.status(200).json({
      status: 'success',
      data: addons
    });
  } catch (err) {
    next(err);
  }
}

async function createAddon(req, res, next) {
  try {
    const addon = await addonsService.createAddon(req.params.productId, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Product add-on created successfully.',
      data: addon
    });
  } catch (err) {
    next(err);
  }
}

async function updateAddon(req, res, next) {
  try {
    const updated = await addonsService.updateAddon(
      req.params.productId,
      req.params.addonId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: 'Product add-on updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAddon(req, res, next) {
  try {
    const result = await addonsService.deleteAddon(
      req.params.productId,
      req.params.addonId
    );
    res.status(200).json({
      status: 'success',
      message: `Add-on "${result.name}" deleted successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAddons,
  createAddon,
  updateAddon,
  deleteAddon
};
