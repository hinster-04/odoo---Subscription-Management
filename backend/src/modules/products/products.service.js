const db = require('../../config/db');

/**
 * Generate a URL-friendly slug from a product name
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all products with search, filtering, sorting, pagination, and counts
 */
async function getProducts({
  search = '',
  category = '',
  product_type = '',
  is_active = '',
  sort_by = 'created_at',
  sort_order = 'desc',
  page = 1,
  limit = 10
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  // Whitelist safe sort columns
  const allowedSortColumns = {
    name: 'p.name',
    sales_price: 'p.sales_price',
    cost_price: 'p.cost_price',
    created_at: 'p.created_at',
    category: 'p.category',
    product_type: 'p.product_type',
    is_active: 'p.is_active'
  };

  const sortColumn = allowedSortColumns[sort_by] || 'p.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(
      `(p.name ILIKE $${idx} OR p.slug ILIKE $${idx} OR p.description ILIKE $${idx} OR p.category ILIKE $${idx})`
    );
  }

  if (category && category !== 'all') {
    queryParams.push(category.trim());
    whereConditions.push(`p.category = $${queryParams.length}`);
  }

  if (product_type && product_type !== 'all') {
    queryParams.push(product_type.trim());
    whereConditions.push(`p.product_type = $${queryParams.length}`);
  }

  if (is_active !== undefined && is_active !== '' && is_active !== 'all') {
    const activeBool = is_active === 'true' || is_active === true;
    queryParams.push(activeBool);
    whereConditions.push(`p.is_active = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Count total matching rows
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Fetch paginated records with variant and addon counts
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.category,
      p.product_type,
      p.description,
      p.sales_price::float AS sales_price,
      p.cost_price::float AS cost_price,
      p.notes,
      p.image_url,
      p.is_active,
      p.created_at,
      p.updated_at,
      COALESCE(v.variants_count, 0)::int AS variants_count,
      COALESCE(a.addons_count, 0)::int AS addons_count
    FROM products p
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS variants_count
      FROM product_variants
      GROUP BY product_id
    ) v ON v.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS addons_count
      FROM product_addons
      GROUP BY product_id
    ) a ON a.product_id = p.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataResult = await db.query(dataQuery, dataParams);

  return {
    items: dataResult.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  };
}

/**
 * Get single product by UUID id with all its variants and add-ons
 */
async function getProductById(id) {
  const productQuery = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.category,
      p.product_type,
      p.description,
      p.sales_price::float AS sales_price,
      p.cost_price::float AS cost_price,
      p.notes,
      p.image_url,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM products p
    WHERE p.id = $1
  `;
  const productResult = await db.query(productQuery, [id]);

  if (productResult.rows.length === 0) {
    return null;
  }

  const product = productResult.rows[0];

  // Fetch variants
  const variantsQuery = `
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
  const variantsResult = await db.query(variantsQuery, [id, product.sales_price]);

  // Fetch add-ons
  const addonsQuery = `
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
  const addonsResult = await db.query(addonsQuery, [id]);

  return {
    ...product,
    variants: variantsResult.rows,
    addons: addonsResult.rows
  };
}

/**
 * Create a new product with optional initial variants and addons in a single transaction
 */
async function createProduct(data) {
  const {
    name,
    slug,
    category,
    product_type,
    description,
    sales_price,
    cost_price,
    notes,
    image_url,
    is_active = true,
    variants = [],
    addons = []
  } = data;

  if (!name || !name.trim()) {
    const error = new Error('Product name is required.');
    error.statusCode = 400;
    throw error;
  }

  const finalSlug = (slug && slug.trim()) ? slugify(slug) : slugify(name);
  if (!finalSlug) {
    const error = new Error('Valid product slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const numericSalesPrice = parseFloat(sales_price);
  if (isNaN(numericSalesPrice) || numericSalesPrice < 0) {
    const error = new Error('Sales price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const numericCostPrice = cost_price !== undefined && cost_price !== '' ? parseFloat(cost_price) : 0;
  if (isNaN(numericCostPrice) || numericCostPrice < 0) {
    const error = new Error('Cost price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  // Check unique slug
  const slugCheck = await db.query('SELECT id FROM products WHERE slug = $1', [finalSlug]);
  if (slugCheck.rows.length > 0) {
    const error = new Error(`A product with slug "${finalSlug}" already exists. Please choose a unique slug.`);
    error.statusCode = 409;
    throw error;
  }

  return await db.transaction(async (client) => {
    // 1. Insert product
    const insertQuery = `
      INSERT INTO products (
        name,
        slug,
        category,
        product_type,
        description,
        sales_price,
        cost_price,
        notes,
        image_url,
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING
        id,
        name,
        slug,
        category,
        product_type,
        description,
        sales_price::float AS sales_price,
        cost_price::float AS cost_price,
        notes,
        image_url,
        is_active,
        created_at,
        updated_at
    `;

    const productValues = [
      name.trim(),
      finalSlug,
      category ? category.trim() : null,
      product_type ? product_type.trim() : null,
      description ? description.trim() : null,
      numericSalesPrice,
      numericCostPrice,
      notes ? notes.trim() : null,
      image_url ? image_url.trim() : null,
      Boolean(is_active)
    ];

    const productResult = await client.query(insertQuery, productValues);
    const newProduct = productResult.rows[0];

    // 2. Insert initial variants if provided
    const insertedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (!v.variant_name || !v.variant_value) continue;
        const adj = parseFloat(v.price_adjustment) || 0;
        const effectivePrice = numericSalesPrice + adj;
        if (effectivePrice < 0) {
          const err = new Error(
            `Variant "${v.variant_name}: ${v.variant_value}" results in a negative effective price ($${effectivePrice.toFixed(2)}).`
          );
          err.statusCode = 400;
          throw err;
        }

        const vRes = await client.query(
          `INSERT INTO product_variants (product_id, variant_name, variant_value, price_adjustment, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING id, product_id, variant_name, variant_value, price_adjustment::float, is_active, created_at, updated_at`,
          [newProduct.id, v.variant_name.trim(), v.variant_value.trim(), adj, v.is_active !== false]
        );
        insertedVariants.push({
          ...vRes.rows[0],
          effective_price: parseFloat((numericSalesPrice + adj).toFixed(2))
        });
      }
    }

    // 3. Insert initial add-ons if provided
    const insertedAddons = [];
    if (Array.isArray(addons) && addons.length > 0) {
      for (const a of addons) {
        if (!a.name || !a.name.trim()) continue;
        const p = parseFloat(a.price) || 0;
        const cp = parseFloat(a.cost_price) || 0;
        if (p < 0 || cp < 0) {
          const err = new Error(`Add-on prices must be non-negative.`);
          err.statusCode = 400;
          throw err;
        }

        const aRes = await client.query(
          `INSERT INTO product_addons (product_id, name, description, price, cost_price, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id, product_id, name, description, price::float, cost_price::float, is_active, created_at, updated_at`,
          [newProduct.id, a.name.trim(), a.description ? a.description.trim() : null, p, cp, a.is_active !== false]
        );
        insertedAddons.push(aRes.rows[0]);
      }
    }

    return {
      ...newProduct,
      variants: insertedVariants,
      addons: insertedAddons
    };
  });
}

/**
 * Update an existing product
 */
async function updateProduct(id, data) {
  const {
    name,
    slug,
    category,
    product_type,
    description,
    sales_price,
    cost_price,
    notes,
    image_url,
    is_active
  } = data;

  // Check product existence
  const existing = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];

  const finalName = name !== undefined ? name.trim() : current.name;
  if (!finalName) {
    const error = new Error('Product name cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const finalSlug = slug !== undefined ? slugify(slug) : current.slug;
  if (!finalSlug) {
    const error = new Error('Product slug cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  // Check slug uniqueness
  if (finalSlug !== current.slug) {
    const slugCheck = await db.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [finalSlug, id]);
    if (slugCheck.rows.length > 0) {
      const error = new Error(`A product with slug "${finalSlug}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const finalSalesPrice = sales_price !== undefined ? parseFloat(sales_price) : parseFloat(current.sales_price);
  if (isNaN(finalSalesPrice) || finalSalesPrice < 0) {
    const error = new Error('Sales price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const finalCostPrice = cost_price !== undefined ? parseFloat(cost_price) : parseFloat(current.cost_price);
  if (isNaN(finalCostPrice) || finalCostPrice < 0) {
    const error = new Error('Cost price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  // Validate that updated sales price does not make any existing variant negative
  const variantsCheck = await db.query(
    'SELECT id, variant_name, variant_value, price_adjustment::float FROM product_variants WHERE product_id = $1',
    [id]
  );

  for (const v of variantsCheck.rows) {
    const effectivePrice = finalSalesPrice + v.price_adjustment;
    if (effectivePrice < 0) {
      const error = new Error(
        `Cannot update sales price to $${finalSalesPrice.toFixed(2)}: Variant "${v.variant_name} - ${v.variant_value}" has an adjustment of $${v.price_adjustment.toFixed(2)}, which would result in a negative effective price ($${effectivePrice.toFixed(2)}).`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const finalCategory = category !== undefined ? (category ? category.trim() : null) : current.category;
  const finalProductType = product_type !== undefined ? (product_type ? product_type.trim() : null) : current.product_type;
  const finalDescription = description !== undefined ? (description ? description.trim() : null) : current.description;
  const finalNotes = notes !== undefined ? (notes ? notes.trim() : null) : current.notes;
  const finalImageUrl = image_url !== undefined ? (image_url ? image_url.trim() : null) : current.image_url;
  const finalIsActive = is_active !== undefined ? Boolean(is_active) : current.is_active;

  const updateQuery = `
    UPDATE products
    SET
      name = $1,
      slug = $2,
      category = $3,
      product_type = $4,
      description = $5,
      sales_price = $6,
      cost_price = $7,
      notes = $8,
      image_url = $9,
      is_active = $10,
      updated_at = NOW()
    WHERE id = $11
    RETURNING
      id,
      name,
      slug,
      category,
      product_type,
      description,
      sales_price::float AS sales_price,
      cost_price::float AS cost_price,
      notes,
      image_url,
      is_active,
      created_at,
      updated_at
  `;

  const values = [
    finalName,
    finalSlug,
    finalCategory,
    finalProductType,
    finalDescription,
    finalSalesPrice,
    finalCostPrice,
    finalNotes,
    finalImageUrl,
    finalIsActive,
    id
  ];

  const result = await db.query(updateQuery, values);
  return result.rows[0];
}

/**
 * Delete a product and its associated variants and add-ons inside a transaction
 */
async function deleteProduct(id) {
  return await db.transaction(async (client) => {
    // 1. Check if product exists
    const check = await client.query('SELECT id, name FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    const product = check.rows[0];

    // 2. Count relations for audit/logging
    const vCount = await client.query('SELECT COUNT(*) FROM product_variants WHERE product_id = $1', [id]);
    const aCount = await client.query('SELECT COUNT(*) FROM product_addons WHERE product_id = $1', [id]);

    // 3. Delete product (foreign keys ON DELETE CASCADE will handle child rows cleanly)
    await client.query('DELETE FROM products WHERE id = $1', [id]);

    return {
      id: product.id,
      name: product.name,
      deletedVariantsCount: parseInt(vCount.rows[0].count, 10),
      deletedAddonsCount: parseInt(aCount.rows[0].count, 10)
    };
  });
}

/**
 * Get distinct categories and product types for filters
 */
async function getFilterMetadata() {
  const categoriesRes = await db.query(`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND TRIM(category) != ''
    ORDER BY category ASC
  `);

  const typesRes = await db.query(`
    SELECT DISTINCT product_type
    FROM products
    WHERE product_type IS NOT NULL AND TRIM(product_type) != ''
    ORDER BY product_type ASC
  `);

  return {
    categories: categoriesRes.rows.map((r) => r.category),
    product_types: typesRes.rows.map((r) => r.product_type)
  };
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterMetadata
};
