const db = require('../../config/db');

/**
 * Get all subscription plans with search, filtering, sorting, pagination, and KPI counts
 */
async function getPlans({
  search = '',
  billing_frequency = 'all',
  is_active = 'all',
  product_id = 'all',
  sort_by = 'created_at',
  sort_order = 'desc',
  page = 1,
  limit = 10
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const allowedSortColumns = {
    name: 'sp.name',
    price: 'sp.price',
    billing_frequency: 'sp.billing_frequency',
    minimum_quantity: 'sp.minimum_quantity',
    created_at: 'sp.created_at',
    is_active: 'sp.is_active',
    product_name: 'p.name'
  };

  const sortColumn = allowedSortColumns[sort_by] || 'sp.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      sp.name ILIKE $${idx} OR
      sp.description ILIKE $${idx} OR
      p.name ILIKE $${idx}
    )`);
  }

  if (billing_frequency && billing_frequency !== 'all') {
    queryParams.push(billing_frequency.toLowerCase().trim());
    whereConditions.push(`LOWER(sp.billing_frequency) = $${queryParams.length}`);
  }

  if (is_active !== 'all' && is_active !== '' && is_active !== undefined) {
    const activeBool = is_active === 'true' || is_active === true;
    queryParams.push(activeBool);
    whereConditions.push(`sp.is_active = $${queryParams.length}`);
  }

  if (product_id && product_id !== 'all') {
    queryParams.push(product_id.trim());
    whereConditions.push(`sp.product_id = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM subscription_plans sp
    JOIN products p ON sp.product_id = p.id
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Data
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      sp.id,
      sp.product_id,
      sp.name,
      sp.description,
      sp.price::float,
      sp.billing_frequency,
      sp.minimum_quantity,
      TO_CHAR(sp.available_from, 'YYYY-MM-DD') AS available_from,
      TO_CHAR(sp.available_until, 'YYYY-MM-DD') AS available_until,
      sp.auto_close_on_end,
      COALESCE(sp.auto_close_days, 30) AS auto_close_days,
      sp.allow_early_closure,
      sp.allow_pause,
      sp.allow_renewal,
      sp.is_active,
      sp.created_at,
      sp.updated_at,
      p.name AS product_name,
      p.category AS product_category
    FROM subscription_plans sp
    JOIN products p ON sp.product_id = p.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataResult = await db.query(dataQuery, dataParams);

  // 3. Overview metrics
  const summaryQuery = `
    SELECT
      COUNT(*) AS total_plans,
      COUNT(*) FILTER (WHERE is_active = true) AS active_plans,
      COUNT(*) FILTER (WHERE is_active = false) AS inactive_plans,
      COUNT(*) FILTER (WHERE allow_renewal = true) AS renewal_enabled_plans,
      COUNT(DISTINCT billing_frequency) AS frequency_types
    FROM subscription_plans
  `;
  const summaryResult = await db.query(summaryQuery);

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: totalPages,
      summary: summaryResult.rows[0]
    }
  };
}

/**
 * Get single subscription plan by ID with associated product
 */
async function getPlanById(id) {
  const query = `
    SELECT
      sp.id,
      sp.product_id,
      sp.name,
      sp.description,
      sp.price::float,
      sp.billing_frequency,
      sp.minimum_quantity,
      TO_CHAR(sp.available_from, 'YYYY-MM-DD') AS available_from,
      TO_CHAR(sp.available_until, 'YYYY-MM-DD') AS available_until,
      sp.auto_close_on_end,
      COALESCE(sp.auto_close_days, 30) AS auto_close_days,
      sp.allow_early_closure,
      sp.allow_pause,
      sp.allow_renewal,
      sp.is_active,
      sp.created_at,
      sp.updated_at,
      p.name AS product_name,
      p.category AS product_category,
      p.sales_price::float AS product_base_price
    FROM subscription_plans sp
    JOIN products p ON sp.product_id = p.id
    WHERE sp.id = $1
  `;

  const result = await db.query(query, [id]);
  if (result.rows.length === 0) {
    const error = new Error('Subscription plan not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

/**
 * Validate subscription plan payload
 */
function validatePlanPayload(data, isUpdate = false) {
  const {
    name,
    product_id,
    price,
    billing_frequency,
    minimum_quantity,
    available_from,
    available_until,
    auto_close_on_end,
    auto_close_days
  } = data;

  if (!isUpdate || name !== undefined) {
    if (!name || !name.trim()) {
      const err = new Error('Plan name is required.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (!isUpdate || product_id !== undefined) {
    if (!product_id) {
      const err = new Error('Associated product is required.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      const err = new Error('Plan price must be a non-negative number.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (!isUpdate || billing_frequency !== undefined) {
    const validFreqs = ['daily', 'weekly', 'monthly', 'yearly'];
    const normFreq = (billing_frequency || '').toLowerCase().trim();
    if (!validFreqs.includes(normFreq)) {
      const err = new Error(`Billing frequency must be one of: ${validFreqs.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (minimum_quantity !== undefined) {
    const minQty = parseInt(minimum_quantity, 10);
    if (isNaN(minQty) || minQty < 1) {
      const err = new Error('Minimum quantity must be at least 1.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (available_from && available_until) {
    if (new Date(available_until) < new Date(available_from)) {
      const err = new Error('Available until date cannot be earlier than available from date.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (auto_close_on_end) {
    if (auto_close_days !== undefined && auto_close_days !== null && auto_close_days !== '') {
      const days = parseInt(auto_close_days, 10);
      if (isNaN(days) || days < 1) {
        const err = new Error('Auto-close duration must be at least 1 day.');
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

/**
 * Create a new subscription plan
 */
async function createPlan(data) {
  validatePlanPayload(data, false);

  const {
    name,
    product_id,
    description = '',
    price = 0,
    billing_frequency = 'monthly',
    minimum_quantity = 1,
    available_from = null,
    available_until = null,
    auto_close_on_end = false,
    auto_close_days = 30,
    allow_early_closure = true,
    allow_pause = true,
    allow_renewal = true,
    is_active = true
  } = data;

  // Verify product exists
  const prodCheck = await db.query('SELECT id, name FROM products WHERE id = $1', [product_id]);
  if (prodCheck.rows.length === 0) {
    const error = new Error('Selected product does not exist.');
    error.statusCode = 400;
    throw error;
  }

  const query = `
    INSERT INTO subscription_plans (
      product_id,
      name,
      description,
      price,
      billing_frequency,
      minimum_quantity,
      available_from,
      available_until,
      auto_close_on_end,
      auto_close_days,
      allow_early_closure,
      allow_pause,
      allow_renewal,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    product_id,
    name.trim(),
    description ? description.trim() : null,
    parseFloat(price) || 0,
    billing_frequency.toLowerCase().trim(),
    parseInt(minimum_quantity, 10) || 1,
    available_from || null,
    available_until || null,
    Boolean(auto_close_on_end),
    auto_close_on_end ? (parseInt(auto_close_days, 10) || 30) : null,
    allow_early_closure !== false,
    allow_pause !== false,
    allow_renewal !== false,
    is_active !== false
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Update an existing subscription plan
 */
async function updatePlan(id, data) {
  const existing = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Subscription plan not found.');
    error.statusCode = 404;
    throw error;
  }

  validatePlanPayload(data, true);

  const current = existing.rows[0];
  const {
    name = current.name,
    product_id = current.product_id,
    description = current.description,
    price = current.price,
    billing_frequency = current.billing_frequency,
    minimum_quantity = current.minimum_quantity,
    available_from = current.available_from,
    available_until = current.available_until,
    auto_close_on_end = current.auto_close_on_end,
    auto_close_days = current.auto_close_days,
    allow_early_closure = current.allow_early_closure,
    allow_pause = current.allow_pause,
    allow_renewal = current.allow_renewal,
    is_active = current.is_active
  } = data;

  if (product_id !== current.product_id) {
    const prodCheck = await db.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (prodCheck.rows.length === 0) {
      const error = new Error('Selected product does not exist.');
      error.statusCode = 400;
      throw error;
    }
  }

  const query = `
    UPDATE subscription_plans
    SET
      product_id = $1,
      name = $2,
      description = $3,
      price = $4,
      billing_frequency = $5,
      minimum_quantity = $6,
      available_from = $7,
      available_until = $8,
      auto_close_on_end = $9,
      auto_close_days = $10,
      allow_early_closure = $11,
      allow_pause = $12,
      allow_renewal = $13,
      is_active = $14,
      updated_at = NOW()
    WHERE id = $15
    RETURNING *
  `;

  const values = [
    product_id,
    name.trim(),
    description ? description.trim() : null,
    parseFloat(price),
    billing_frequency.toLowerCase().trim(),
    parseInt(minimum_quantity, 10),
    available_from || null,
    available_until || null,
    Boolean(auto_close_on_end),
    auto_close_on_end ? (parseInt(auto_close_days, 10) || 30) : null,
    Boolean(allow_early_closure),
    Boolean(allow_pause),
    Boolean(allow_renewal),
    Boolean(is_active),
    id
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Toggle plan active status
 */
async function togglePlanStatus(id, isActive) {
  const query = `
    UPDATE subscription_plans
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  const result = await db.query(query, [Boolean(isActive), id]);
  if (result.rows.length === 0) {
    const error = new Error('Subscription plan not found.');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Delete a subscription plan
 */
async function deletePlan(id) {
  const check = await db.query('SELECT id, name FROM subscription_plans WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    const error = new Error('Subscription plan not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check if actively referenced in quotation_items or subscription_items
  const refQuotes = await db.query('SELECT count(*) FROM quotation_items WHERE plan_id = $1', [id]);
  const refSubs = await db.query('SELECT count(*) FROM subscription_items WHERE plan_id = $1', [id]);

  const activeRefCount = parseInt(refQuotes.rows[0].count, 10) + parseInt(refSubs.rows[0].count, 10);
  if (activeRefCount > 0) {
    const error = new Error('Cannot delete this plan because it is referenced by existing quotations or subscriptions. You can deactivate it instead.');
    error.statusCode = 400;
    throw error;
  }

  await db.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
  return { success: true, message: 'Subscription plan deleted successfully.' };
}

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan
};
