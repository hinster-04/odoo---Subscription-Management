const productsService = require('./products.service');

async function listProducts(req, res, next) {
  try {
    const result = await productsService.getProducts(req.query);
    res.status(200).json({
      status: 'success',
      data: result.items,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productsService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found.'
      });
    }
    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const newProduct = await productsService.createProduct(req.body);
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully.',
      data: newProduct
    });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const updated = await productsService.updateProduct(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const result = await productsService.deleteProduct(req.params.id);
    res.status(200).json({
      status: 'success',
      message: `Product "${result.name}" and associated records deleted successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getFilterMeta(req, res, next) {
  try {
    const meta = await productsService.getFilterMetadata();
    res.status(200).json({
      status: 'success',
      data: meta
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterMeta
};
