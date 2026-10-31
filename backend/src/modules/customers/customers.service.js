const db = require('../../config/db');

/**
 * Get all customers with search, filtering, sorting, and pagination
 */
async function getCustomers({
  search = '',
  status = 'all',
  business_type = 'all',
  sort_by = 'created_at',
  sort_order = 'desc',
  page = 1,
  limit = 10
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const allowedSortColumns = {
    name: 'u.first_name',
    business_name: 'u.business_name',
    email: 'a.email',
    created_at: 'a.created_at',
    city: 'u.city',
    status: 'a.is_active'
  };

  const sortColumn = allowedSortColumns[sort_by] || 'a.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = ["a.role = 'customer'"];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      u.first_name ILIKE $${idx} OR
      u.last_name ILIKE $${idx} OR
      u.business_name ILIKE $${idx} OR
      a.email ILIKE $${idx} OR
      u.phone ILIKE $${idx} OR
      u.city ILIKE $${idx} OR
      CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx}
    )`);
  }

  if (status !== 'all' && status !== '' && status !== undefined) {
    const activeBool = status === 'true' || status === true;
    queryParams.push(activeBool);
    whereConditions.push(`a.is_active = $${queryParams.length}`);
  }

  if (business_type && business_type !== 'all') {
    queryParams.push(business_type.trim());
    whereConditions.push(`u.business_type = $${queryParams.length}`);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  // 1. Total count query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM users u
    JOIN auth a ON u.auth_id = a.id
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Data query
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      u.id,
      u.auth_id,
      u.first_name,
      u.last_name,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS full_name,
      u.business_name,
      u.business_type,
      a.email,
      u.phone,
      u.address,
      u.city,
      u.state,
      u.country,
      u.postal_code,
      a.is_active,
      a.email_verified,
      a.created_at AS registration_date,
      u.updated_at AS last_updated_date
    FROM users u
    JOIN auth a ON u.auth_id = a.id
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
 * Get single customer by user profile id or auth id
 */
async function getCustomerById(id) {
  const query = `
    SELECT
      u.id,
      u.auth_id,
      u.first_name,
      u.last_name,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS full_name,
      u.business_name,
      u.business_type,
      a.email,
      u.phone,
      u.address,
      u.city,
      u.state,
      u.country,
      u.postal_code,
      a.is_active,
      a.email_verified,
      a.created_at AS registration_date,
      u.updated_at AS last_updated_date
    FROM users u
    JOIN auth a ON u.auth_id = a.id
    WHERE u.id = $1 OR u.auth_id = $1
    LIMIT 1
  `;

  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Update customer personal and business details in a transaction
 */
async function updateCustomer(id, data) {
  const {
    first_name,
    last_name,
    email,
    phone,
    business_name,
    business_type,
    address,
    city,
    state,
    country,
    postal_code,
    is_active
  } = data;

  return await db.transaction(async (client) => {
    // 1. Check existing customer
    const existing = await client.query(
      `SELECT u.id, u.auth_id, a.email
       FROM users u
       JOIN auth a ON u.auth_id = a.id
       WHERE u.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      const error = new Error('Customer account not found.');
      error.statusCode = 404;
      throw error;
    }

    const customer = existing.rows[0];

    // 2. Validate and update email if changed
    if (email && email.trim().toLowerCase() !== customer.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailCheck = await client.query(
        'SELECT id FROM auth WHERE email = $1 AND id != $2',
        [cleanEmail, customer.auth_id]
      );

      if (emailCheck.rows.length > 0) {
        const error = new Error(`Email "${cleanEmail}" is already registered to another account.`);
        error.statusCode = 409;
        throw error;
      }

      await client.query(
        'UPDATE auth SET email = $1, updated_at = NOW() WHERE id = $2',
        [cleanEmail, customer.auth_id]
      );
    }

    // 3. Update active status if provided
    if (is_active !== undefined) {
      await client.query(
        'UPDATE auth SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [Boolean(is_active), customer.auth_id]
      );
    }

    // 4. Update users profile
    const updateUsersQuery = `
      UPDATE users
      SET
        first_name = COALESCE($1, first_name),
        last_name = $2,
        business_name = $3,
        business_type = $4,
        phone = $5,
        address = $6,
        city = $7,
        state = $8,
        country = $9,
        postal_code = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    await client.query(updateUsersQuery, [
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      business_name ? business_name.trim() : null,
      business_type ? business_type.trim() : null,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      city ? city.trim() : null,
      state ? state.trim() : null,
      country ? country.trim() : null,
      postal_code ? postal_code.trim() : null,
      id
    ]);

    // 5. Return updated customer record
    const updated = await client.query(
      `SELECT
        u.id,
        u.auth_id,
        u.first_name,
        u.last_name,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS full_name,
        u.business_name,
        u.business_type,
        a.email,
        u.phone,
        u.address,
        u.city,
        u.state,
        u.country,
        u.postal_code,
        a.is_active,
        a.email_verified,
        a.created_at AS registration_date,
        u.updated_at AS last_updated_date
      FROM users u
      JOIN auth a ON u.auth_id = a.id
      WHERE u.id = $1`,
      [id]
    );

    return updated.rows[0];
  });
}

/**
 * Activate or deactivate customer account
 */
async function setCustomerStatus(id, isActive) {
  const result = await db.transaction(async (client) => {
    const userRes = await client.query('SELECT auth_id, first_name, last_name FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      const error = new Error('Customer not found.');
      error.statusCode = 404;
      throw error;
    }

    const { auth_id, first_name, last_name } = userRes.rows[0];
    await client.query('UPDATE auth SET is_active = $1, updated_at = NOW() WHERE id = $2', [Boolean(isActive), auth_id]);

    return {
      id,
      auth_id,
      name: `${first_name} ${last_name || ''}`.trim(),
      is_active: Boolean(isActive)
    };
  });

  return result;
}

/**
 * Get filter metadata and summary statistics for customers
 */
async function getCustomerMetadata() {
  const typesRes = await db.query(`
    SELECT DISTINCT business_type
    FROM users
    WHERE business_type IS NOT NULL AND TRIM(business_type) != ''
    ORDER BY business_type ASC
  `);

  const countsRes = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE a.is_active = true) AS active,
      COUNT(*) FILTER (WHERE a.is_active = false) AS inactive
    FROM users u
    JOIN auth a ON u.auth_id = a.id
    WHERE a.role = 'customer'
  `);

  return {
    business_types: typesRes.rows.map((r) => r.business_type),
    counts: {
      total: parseInt(countsRes.rows[0].total, 10),
      active: parseInt(countsRes.rows[0].active, 10),
      inactive: parseInt(countsRes.rows[0].inactive, 10)
    }
  };
}

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  setCustomerStatus,
  getCustomerMetadata
};
