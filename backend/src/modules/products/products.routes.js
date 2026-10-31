const express = require('express');
const productsController = require('./products.controller');
const variantsController = require('./variants.controller');
const addonsController = require('./addons.controller');

const router = express.Router();

// --- Product Endpoints ---
router.get('/meta/categories', productsController.getFilterMeta);
router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);
router.post('/', productsController.createProduct);
router.put('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

// --- Product Variant Endpoints ---
router.get('/:productId/variants', variantsController.listVariants);
router.post('/:productId/variants', variantsController.createVariant);
router.put('/:productId/variants/:variantId', variantsController.updateVariant);
router.delete('/:productId/variants/:variantId', variantsController.deleteVariant);

// --- Product Add-on Endpoints ---
router.get('/:productId/addons', addonsController.listAddons);
router.post('/:productId/addons', addonsController.createAddon);
router.put('/:productId/addons/:addonId', addonsController.updateAddon);
router.delete('/:productId/addons/:addonId', addonsController.deleteAddon);

module.exports = router;
