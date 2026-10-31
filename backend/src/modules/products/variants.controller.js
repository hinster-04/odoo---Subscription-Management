const variantsService = require('./variants.service');

async function listVariants(req, res, next) {
  try {
    const variants = await variantsService.getVariantsByProductId(req.params.productId);
    res.status(200).json({
      status: 'success',
      data: variants
    });
  } catch (err) {
    next(err);
  }
}

async function createVariant(req, res, next) {
  try {
    const variant = await variantsService.createVariant(req.params.productId, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Product variant created successfully.',
      data: variant
    });
  } catch (err) {
    next(err);
  }
}

async function updateVariant(req, res, next) {
  try {
    const updated = await variantsService.updateVariant(
      req.params.productId,
      req.params.variantId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: 'Product variant updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteVariant(req, res, next) {
  try {
    const result = await variantsService.deleteVariant(
      req.params.productId,
      req.params.variantId
    );
    res.status(200).json({
      status: 'success',
      message: `Variant "${result.variant_name}: ${result.variant_value}" deleted successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant
};
