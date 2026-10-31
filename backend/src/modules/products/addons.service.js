const db = require('../../config/db');

/**
 * Get all add-ons for a specific product
 */
async function getAddonsByProductId(productId) {
  // Verify product exists
  const productRes = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
  if (productRes.rows.length === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const query = `
    SELECT
      a.id,
      a.product_id,
      a.name,
      a.description,
      a.price::float AS price,
      a.cost_price::float AS cost_price,
      a.is_active,
      a.created_at,
      a.updated_at
    FROM product_addons a
    WHERE a.product_id = $1
    ORDER BY a.name ASC
  `;

  const result = await db.query(query, [productId]);
  return result.rows;
}

/**
 * Create a new add-on for a product
 */
async function createAddon(productId, data) {
  const { name, description, price = 0, cost_price = 0, is_active = true } = data;

  if (!name || !name.trim()) {
    const error = new Error('Add-on name is required.');
    error.statusCode = 400;
    throw error;
  }

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    const error = new Error('Add-on price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const numCostPrice = cost_price !== undefined && cost_price !== '' ? parseFloat(cost_price) : 0;
  if (isNaN(numCostPrice) || numCostPrice < 0) {
    const error = new Error('Add-on cost price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  // Verify product exists
  const productRes = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
  if (productRes.rows.length === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const insertQuery = `
    INSERT INTO product_addons (
      product_id,
      name,
      description,
      price,
      cost_price,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING
      id,
      product_id,
      name,
      description,
      price::float AS price,
      cost_price::float AS cost_price,
      is_active,
      created_at,
      updated_at
  `;

  const values = [
    productId,
    name.trim(),
    description ? description.trim() : null,
    numPrice,
    numCostPrice,
    Boolean(is_active)
  ];

  const result = await db.query(insertQuery, values);
  return result.rows[0];
}

/**
 * Update an existing add-on
 */
async function updateAddon(productId, addonId, data) {
  const { name, description, price, cost_price, is_active } = data;

  // Check existence
  const existing = await db.query(
    'SELECT * FROM product_addons WHERE id = $1 AND product_id = $2',
    [addonId, productId]
  );

  if (existing.rows.length === 0) {
    const error = new Error('Add-on not found for this product.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];

  const finalName = name !== undefined ? name.trim() : current.name;
  if (!finalName) {
    const error = new Error('Add-on name cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const finalPrice = price !== undefined ? parseFloat(price) : parseFloat(current.price);
  if (isNaN(finalPrice) || finalPrice < 0) {
    const error = new Error('Add-on price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const finalCostPrice = cost_price !== undefined ? parseFloat(cost_price) : parseFloat(current.cost_price);
  if (isNaN(finalCostPrice) || finalCostPrice < 0) {
    const error = new Error('Add-on cost price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const finalDescription = description !== undefined ? (description ? description.trim() : null) : current.description;
  const finalIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;

  const updateQuery = `
    UPDATE product_addons
    SET
      name = $1,
      description = $2,
      price = $3,
      cost_price = $4,
      is_active = $5,
      updated_at = NOW()
    WHERE id = $6 AND product_id = $7
    RETURNING
      id,
      product_id,
      name,
      description,
      price::float AS price,
      cost_price::float AS cost_price,
      is_active,
      created_at,
      updated_at
  `;

  const values = [finalName, finalDescription, finalPrice, finalCostPrice, finalIsActive, addonId, productId];
  const result = await db.query(updateQuery, values);

  return result.rows[0];
}

/**
 * Delete an add-on
 */
async function deleteAddon(productId, addonId) {
  const result = await db.query(
    'DELETE FROM product_addons WHERE id = $1 AND product_id = $2 RETURNING id, name',
    [addonId, productId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Add-on not found for this product.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  getAddonsByProductId,
  createAddon,
  updateAddon,
  deleteAddon
};
