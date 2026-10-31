const bcrypt = require('bcryptjs');
const db = require('../../config/db');

// bcrypt cost factor — matches auth.service.js
const BCRYPT_ROUNDS = 12;

/**
 * Get all staff and admin members with search, filtering, sorting, and pagination
 */
async function getStaff({
  search = '',
  status = 'all',
  designation = 'all',
  role = 'all',
  sort_by = 'created_at',
  sort_order = 'desc',
  page = 1,
  limit = 10
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const allowedSortColumns = {
    name: 'ad.first_name',
    email: 'a.email',
    designation: 'ad.designation',
    created_at: 'ad.created_at',
    status: 'a.is_active',
    role: 'a.role'
  };

  const sortColumn = allowedSortColumns[sort_by] || 'ad.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = ["a.role IN ('admin', 'staff')"];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      ad.first_name ILIKE $${idx} OR
      ad.last_name ILIKE $${idx} OR
      a.email ILIKE $${idx} OR
      ad.designation ILIKE $${idx} OR
      ad.phone ILIKE $${idx} OR
      CONCAT(ad.first_name, ' ', ad.last_name) ILIKE $${idx}
    )`);
  }

  if (status !== 'all' && status !== '' && status !== undefined) {
    const activeBool = status === 'true' || status === true;
    queryParams.push(activeBool);
    whereConditions.push(`a.is_active = $${queryParams.length}`);
  }

  if (designation && designation !== 'all') {
    queryParams.push(designation.trim());
    whereConditions.push(`ad.designation = $${queryParams.length}`);
  }

  if (role && role !== 'all') {
    queryParams.push(role.trim());
    whereConditions.push(`a.role = $${queryParams.length}`);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  // 1. Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM admin ad
    JOIN auth a ON ad.auth_id = a.id
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
      ad.id,
      ad.auth_id,
      ad.first_name,
      ad.last_name,
      TRIM(CONCAT(ad.first_name, ' ', COALESCE(ad.last_name, ''))) AS full_name,
      a.email,
      ad.phone,
      ad.designation,
      a.role,
      a.is_active,
      ad.created_at AS date_added,
      ad.updated_at AS last_updated_date
    FROM admin ad
    JOIN auth a ON ad.auth_id = a.id
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
 * Get single staff member by admin profile id or auth id
 */
async function getStaffById(id) {
  const query = `
    SELECT
      ad.id,
      ad.auth_id,
      ad.first_name,
      ad.last_name,
      TRIM(CONCAT(ad.first_name, ' ', COALESCE(ad.last_name, ''))) AS full_name,
      a.email,
      ad.phone,
      ad.designation,
      a.role,
      a.is_active,
      ad.created_at AS date_added,
      ad.updated_at AS last_updated_date
    FROM admin ad
    JOIN auth a ON ad.auth_id = a.id
    WHERE ad.id = $1 OR ad.auth_id = $1
    LIMIT 1
  `;

  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Create a new staff account in an atomic transaction
 * Validates unique email, hashes password with bcrypt 12 rounds,
 * automatically assigns 'staff' role in auth and inserts admin profile.
 */
async function createStaff(data) {
  const { first_name, last_name, email, phone, designation, password } = data;

  if (!first_name || !first_name.trim()) {
    const error = new Error('First name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error('Email address is required.');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    const error = new Error('Please enter a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || password.length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  if (!designation || !designation.trim()) {
    const error = new Error('Staff designation/role title is required.');
    error.statusCode = 400;
    throw error;
  }

  // Check unique email before transaction
  const existing = await db.query('SELECT id FROM auth WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    const error = new Error(`An account with email "${cleanEmail}" already exists.`);
    error.statusCode = 409;
    throw error;
  }

  // Hash password securely with 12 bcrypt rounds
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return await db.transaction(async (client) => {
    // 1. Insert into auth table with 'staff' role
    const authInsertQuery = `
      INSERT INTO auth (
        email,
        password_hash,
        role,
        is_active,
        email_verified,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'staff', true, true, NOW(), NOW())
      RETURNING id, email, role, is_active, created_at
    `;

    const authRes = await client.query(authInsertQuery, [cleanEmail, passwordHash]);
    const authRecord = authRes.rows[0];

    // 2. Insert into admin profile table
    const adminInsertQuery = `
      INSERT INTO admin (
        auth_id,
        first_name,
        last_name,
        phone,
        designation,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, auth_id, first_name, last_name, phone, designation, created_at, updated_at
    `;

    const adminValues = [
      authRecord.id,
      first_name.trim(),
      last_name ? last_name.trim() : null,
      phone ? phone.trim() : null,
      designation.trim()
    ];

    const adminRes = await client.query(adminInsertQuery, adminValues);
    const adminRecord = adminRes.rows[0];

    return {
      id: adminRecord.id,
      auth_id: authRecord.id,
      first_name: adminRecord.first_name,
      last_name: adminRecord.last_name,
      full_name: `${adminRecord.first_name} ${adminRecord.last_name || ''}`.trim(),
      email: authRecord.email,
      phone: adminRecord.phone,
      designation: adminRecord.designation,
      role: authRecord.role,
      is_active: authRecord.is_active,
      date_added: adminRecord.created_at
    };
  });
}

/**
 * Update staff details (name, phone, designation, email) in a transaction
 */
async function updateStaff(id, data) {
  const { first_name, last_name, email, phone, designation, is_active } = data;

  return await db.transaction(async (client) => {
    // 1. Check existing staff
    const existing = await client.query(
      `SELECT ad.id, ad.auth_id, a.email, a.role
       FROM admin ad
       JOIN auth a ON ad.auth_id = a.id
       WHERE ad.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      const error = new Error('Staff member not found.');
      error.statusCode = 404;
      throw error;
    }

    const current = existing.rows[0];

    // 2. Check and update email if changed
    if (email && email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailCheck = await client.query(
        'SELECT id FROM auth WHERE email = $1 AND id != $2',
        [cleanEmail, current.auth_id]
      );

      if (emailCheck.rows.length > 0) {
        const error = new Error(`Email "${cleanEmail}" is already registered to another account.`);
        error.statusCode = 409;
        throw error;
      }

      await client.query(
        'UPDATE auth SET email = $1, updated_at = NOW() WHERE id = $2',
        [cleanEmail, current.auth_id]
      );
    }

    // 3. Update active status if provided
    if (is_active !== undefined) {
      await client.query(
        'UPDATE auth SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [Boolean(is_active), current.auth_id]
      );
    }

    // 4. Update admin profile
    const updateAdminQuery = `
      UPDATE admin
      SET
        first_name = COALESCE($1, first_name),
        last_name = $2,
        phone = $3,
        designation = COALESCE($4, designation),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    await client.query(updateAdminQuery, [
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      phone ? phone.trim() : null,
      designation ? designation.trim() : null,
      id
    ]);

    // 5. Fetch updated staff record
    const updated = await client.query(
      `SELECT
        ad.id,
        ad.auth_id,
        ad.first_name,
        ad.last_name,
        TRIM(CONCAT(ad.first_name, ' ', COALESCE(ad.last_name, ''))) AS full_name,
        a.email,
        ad.phone,
        ad.designation,
        a.role,
        a.is_active,
        ad.created_at AS date_added,
        ad.updated_at AS last_updated_date
      FROM admin ad
      JOIN auth a ON ad.auth_id = a.id
      WHERE ad.id = $1`,
      [id]
    );

    return updated.rows[0];
  });
}

/**
 * Activate or deactivate staff account
 */
async function setStaffStatus(id, isActive) {
  const result = await db.transaction(async (client) => {
    const adminRes = await client.query(
      `SELECT ad.auth_id, ad.first_name, ad.last_name, a.role
       FROM admin ad
       JOIN auth a ON ad.auth_id = a.id
       WHERE ad.id = $1`,
      [id]
    );

    if (adminRes.rows.length === 0) {
      const error = new Error('Staff member not found.');
      error.statusCode = 404;
      throw error;
    }

    const { auth_id, first_name, last_name, role } = adminRes.rows[0];

    // Prevent deactivating the only active admin
    if (!isActive && role === 'admin') {
      const activeAdminCountRes = await client.query(
        "SELECT COUNT(*) FROM auth WHERE role = 'admin' AND is_active = true"
      );
      const activeAdminCount = parseInt(activeAdminCountRes.rows[0].count, 10);
      if (activeAdminCount <= 1) {
        const error = new Error('Cannot deactivate the sole active Administrator account.');
        error.statusCode = 400;
        throw error;
      }
    }

    await client.query('UPDATE auth SET is_active = $1, updated_at = NOW() WHERE id = $2', [Boolean(isActive), auth_id]);

    return {
      id,
      auth_id,
      name: `${first_name} ${last_name || ''}`.trim(),
      role,
      is_active: Boolean(isActive)
    };
  });

  return result;
}

/**
 * Get distinct designations and staff summary statistics
 */
async function getStaffMetadata() {
  const designationsRes = await db.query(`
    SELECT DISTINCT designation
    FROM admin
    WHERE designation IS NOT NULL AND TRIM(designation) != ''
    ORDER BY designation ASC
  `);

  const countsRes = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE a.role = 'admin') AS admins,
      COUNT(*) FILTER (WHERE a.role = 'staff') AS staff,
      COUNT(*) FILTER (WHERE a.is_active = true) AS active,
      COUNT(*) FILTER (WHERE a.is_active = false) AS inactive
    FROM admin ad
    JOIN auth a ON ad.auth_id = a.id
  `);

  return {
    designations: designationsRes.rows.map((r) => r.designation),
    counts: {
      total: parseInt(countsRes.rows[0].total, 10),
      admins: parseInt(countsRes.rows[0].admins, 10),
      staff: parseInt(countsRes.rows[0].staff, 10),
      active: parseInt(countsRes.rows[0].active, 10),
      inactive: parseInt(countsRes.rows[0].inactive, 10)
    }
  };
}

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  setStaffStatus,
  getStaffMetadata
};
