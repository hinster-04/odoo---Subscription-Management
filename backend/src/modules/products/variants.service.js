const db = require('../../config/db');

/**
 * Get all variants for a specific product
 */
async function getVariantsByProductId(productId) {
  // First check if product exists and get sales price
  const productRes = await db.query('SELECT id, sales_price::float AS sales_price FROM products WHERE id = $1', [productId]);
  if (productRes.rows.length === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const salesPrice = productRes.rows[0].sales_price;

  const query = `
    SELECT
      v.id,
      v.product_id,
      v.variant_name,
      v.variant_value,
      v.price_adjustment::float AS price_adjustment,
      (ROUND(($2::numeric + v.price_adjustment), 2))::float AS effective_price,
      v.is_active,
      v.created_at,
      v.updated_at
    FROM product_variants v
    WHERE v.product_id = $1
    ORDER BY v.variant_name ASC, v.variant_value ASC
  `;

  const result = await db.query(query, [productId, salesPrice]);
  return result.rows;
}

/**
 * Create a new variant for a product
 */
async function createVariant(productId, data) {
  const { variant_name, variant_value, price_adjustment = 0, is_active = true } = data;

  if (!variant_name || !variant_name.trim()) {
    const error = new Error('Variant name is required (e.g., Edition, Cloud Region, License Tier).');
    error.statusCode = 400;
    throw error;
  }

  if (!variant_value || !variant_value.trim()) {
    const error = new Error('Variant value is required (e.g., Enterprise, US-East, Pro).');
    error.statusCode = 400;
    throw error;
  }

  const numAdjustment = parseFloat(price_adjustment);
  if (isNaN(numAdjustment)) {
    const error = new Error('Price adjustment must be a valid number (positive, zero, or negative).');
    error.statusCode = 400;
    throw error;
  }

  // Fetch parent product to check existence and effective price
  const productRes = await db.query('SELECT id, sales_price::float AS sales_price FROM products WHERE id = $1', [productId]);
  if (productRes.rows.length === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const baseSalesPrice = productRes.rows[0].sales_price;
  const effectivePrice = baseSalesPrice + numAdjustment;

  // Prevent effective price from becoming negative
  if (effectivePrice < 0) {
    const error = new Error(
      `Effective price cannot be negative. Base sales price is $${baseSalesPrice.toFixed(2)}, adjustment of $${numAdjustment.toFixed(2)} would result in $${effectivePrice.toFixed(2)}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate variants for the same product
  const dupCheck = await db.query(
    'SELECT id FROM product_variants WHERE product_id = $1 AND LOWER(TRIM(variant_name)) = LOWER(TRIM($2)) AND LOWER(TRIM(variant_value)) = LOWER(TRIM($3))',
    [productId, variant_name, variant_value]
  );

  if (dupCheck.rows.length > 0) {
    const error = new Error(
      `A variant with name "${variant_name.trim()}" and value "${variant_value.trim()}" already exists for this product.`
    );
    error.statusCode = 409;
    throw error;
  }

  const insertQuery = `
    INSERT INTO product_variants (
      product_id,
      variant_name,
      variant_value,
      price_adjustment,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING
      id,
      product_id,
      variant_name,
      variant_value,
      price_adjustment::float AS price_adjustment,
      is_active,
      created_at,
      updated_at
  `;

  const values = [
    productId,
    variant_name.trim(),
    variant_value.trim(),
    numAdjustment,
    Boolean(is_active)
  ];

  const result = await db.query(insertQuery, values);
  return {
    ...result.rows[0],
    effective_price: parseFloat(effectivePrice.toFixed(2))
  };
}

/**
 * Update an existing variant
 */
async function updateVariant(productId, variantId, data) {
  const { variant_name, variant_value, price_adjustment, is_active } = data;

  // Check variant existence
  const existing = await db.query(
    'SELECT * FROM product_variants WHERE id = $1 AND product_id = $2',
    [variantId, productId]
  );

  if (existing.rows.length === 0) {
    const error = new Error('Variant not found for this product.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];

  // Fetch parent product sales price
  const productRes = await db.query('SELECT sales_price::float AS sales_price FROM products WHERE id = $1', [productId]);
  const baseSalesPrice = productRes.rows[0].sales_price;

  const finalName = variant_name !== undefined ? variant_name.trim() : current.variant_name;
  if (!finalName) {
    const error = new Error('Variant name cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const finalValue = variant_value !== undefined ? variant_value.trim() : current.variant_value;
  if (!finalValue) {
    const error = new Error('Variant value cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const finalAdjustment = price_adjustment !== undefined ? parseFloat(price_adjustment) : parseFloat(current.price_adjustment);
  if (isNaN(finalAdjustment)) {
    const error = new Error('Price adjustment must be a valid number.');
    error.statusCode = 400;
    throw error;
  }

  const effectivePrice = baseSalesPrice + finalAdjustment;
  if (effectivePrice < 0) {
    const error = new Error(
      `Effective price cannot be negative. Base sales price is $${baseSalesPrice.toFixed(2)}, adjustment of $${finalAdjustment.toFixed(2)} would result in $${effectivePrice.toFixed(2)}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate variants for the same product (excluding this variant)
  const dupCheck = await db.query(
    `SELECT id FROM product_variants
     WHERE product_id = $1
       AND LOWER(TRIM(variant_name)) = LOWER(TRIM($2))
       AND LOWER(TRIM(variant_value)) = LOWER(TRIM($3))
       AND id != $4`,
    [productId, finalName, finalValue, variantId]
  );

  if (dupCheck.rows.length > 0) {
    const error = new Error(
      `A variant with name "${finalName}" and value "${finalValue}" already exists for this product.`
    );
    error.statusCode = 409;
    throw error;
  }

  const finalIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;

  const updateQuery = `
    UPDATE product_variants
    SET
      variant_name = $1,
      variant_value = $2,
      price_adjustment = $3,
      is_active = $4,
      updated_at = NOW()
    WHERE id = $5 AND product_id = $6
    RETURNING
      id,
      product_id,
      variant_name,
      variant_value,
      price_adjustment::float AS price_adjustment,
      is_active,
      created_at,
      updated_at
  `;

  const values = [finalName, finalValue, finalAdjustment, finalIsActive, variantId, productId];
  const result = await db.query(updateQuery, values);

  return {
    ...result.rows[0],
    effective_price: parseFloat(effectivePrice.toFixed(2))
  };
}

/**
 * Delete a variant
 */
async function deleteVariant(productId, variantId) {
  const result = await db.query(
    'DELETE FROM product_variants WHERE id = $1 AND product_id = $2 RETURNING id, variant_name, variant_value',
    [variantId, productId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Variant not found for this product.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  getVariantsByProductId,
  createVariant,
  updateVariant,
  deleteVariant
};
