const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

// bcrypt cost factor — 12 rounds is the recommended production minimum
const BCRYPT_ROUNDS = 12;

/**
 * registerCustomer(data)
 *
 * Creates a new customer account atomically inside a Prisma transaction.
 *
 * Receives pre-validated, pre-normalized data from the controller.
 * The `role`, `is_active`, and `email_verified` fields are set here in the
 * service — they are NEVER sourced from the incoming request.
 *
 * Transaction guarantees:
 *   - If the `users` profile insert fails, the `auth` record is rolled back.
 *   - No partial state is left in the database.
 *
 * @param {object} data - Validated fields from registerSchema
 * @returns {object} Sanitized profile — no password_hash, no auth internals
 * @throws {Error} with .statusCode = 409 on duplicate email
 * @throws Prisma errors propagated to the centralized error handler
 */
async function registerCustomer(data) {
  const {
    email,
    password,
    first_name,
    last_name,
    business_name,
    business_type,
    phone,
    address,
    city,
    state,
    country,
    postal_code,
  } = data;

  // Hash the password — never log the plaintext or the hash
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Check for duplicate email before the transaction to give a clear error.
  // The transaction also handles P2002, but a pre-check gives a cleaner message.
  const existing = await prisma.auth.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  // ── Atomic transaction ─────────────────────────────────────────────────────
  // Both records must be created together. If the users insert fails,
  // the auth insert is rolled back automatically by Prisma.
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the auth record — role is hardcoded to 'customer' here
    const authRecord = await tx.auth.create({
      data: {
        email,
        password_hash,
        role: 'customer',       // enforced in service — never from request
        is_active: true,        // enforced in service — never from request
        email_verified: false,  // enforced in service — never from request
      },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
      },
    });

    // 2. Create the customer profile linked to the new auth record
    const profile = await tx.users.create({
      data: {
        auth_id: authRecord.id,
        first_name,
        last_name:     last_name     ?? null,
        business_name: business_name ?? null,
        business_type: business_type ?? null,
        phone:         phone         ?? null,
        address:       address       ?? null,
        city:          city          ?? null,
        state:         state         ?? null,
        country:       country       ?? null,
        postal_code:   postal_code   ?? null,
      },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        business_name: true,
        business_type: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postal_code: true,
        created_at: true,
      },
    });

    return { auth: authRecord, profile };
  });

  // ── Build the safe response — password_hash is never included ─────────────
  return {
    id: result.profile.id,
    auth_id: result.auth.id,
    email: result.auth.email,
    role: result.auth.role,
    email_verified: result.auth.email_verified,
    first_name: result.profile.first_name,
    last_name: result.profile.last_name,
    business_name: result.profile.business_name,
    business_type: result.profile.business_type,
    phone: result.profile.phone,
    address: result.profile.address,
    city: result.profile.city,
    state: result.profile.state,
    country: result.profile.country,
    postal_code: result.profile.postal_code,
    created_at: result.profile.created_at,
  };
}

/**
 * loginUser(credentials)
 *
 * Authenticates user credentials and returns signed JWT access token
 * with sanitized user profile.
 *
 * Security invariants:
 *   - Generic 401 error for both unknown email and incorrect password (prevents user enumeration)
 *   - Passwords and password_hash are never logged or returned
 *   - Rejects inactive accounts with 401
 *   - Rejects accounts with missing or inconsistent profiles with 403
 *   - Signs JWT with sub = auth UUID and standard claims (iat, exp)
 *
 * @param {object} credentials - { email, password }
 * @returns {object} { accessToken, tokenType, expiresIn, user }
 */
async function loginUser({ email, password }) {
  const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

  // 1. Find account by normalized email
  const account = await prisma.auth.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password_hash: true,
      role: true,
      is_active: true,
      email_verified: true,
      created_at: true,
      updated_at: true,
    },
  });

  // 2. Account existence check
  if (!account) {
    const err = new Error(INVALID_CREDENTIALS_MSG);
    err.statusCode = 401;
    throw err;
  }

  // 3. Password verification
  const isMatch = await bcrypt.compare(password, account.password_hash);
  if (!isMatch) {
    const err = new Error(INVALID_CREDENTIALS_MSG);
    err.statusCode = 401;
    throw err;
  }

  // 4. Inactive account check
  if (!account.is_active) {
    const err = new Error('Account is deactivated');
    err.statusCode = 401;
    throw err;
  }

  // 5. Resolve user profile based on role
  let profile = null;
  if (account.role === 'admin' || account.role === 'staff') {
    profile = await prisma.admin.findUnique({
      where: { auth_id: account.id },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        phone: true,
        designation: true,
        created_at: true,
        updated_at: true,
      },
    });
  } else if (account.role === 'customer') {
    profile = await prisma.users.findUnique({
      where: { auth_id: account.id },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        business_name: true,
        business_type: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postal_code: true,
        created_at: true,
        updated_at: true,
      },
    });
  } else {
    // Inconsistent role
    const err = new Error('Account profile is incomplete or inconsistent. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // 6. Inconsistent/missing profile record check
  if (!profile) {
    const err = new Error('Account profile is incomplete or inconsistent. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // 7. Assemble sanitized profile (no password_hash)
  let user;
  if (account.role === 'admin' || account.role === 'staff') {
    user = {
      id: profile.id,
      auth_id: account.id,
      email: account.email,
      role: account.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      designation: profile.designation,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } else {
    user = {
      id: profile.id,
      auth_id: account.id,
      email: account.email,
      role: account.role,
      email_verified: account.email_verified,
      first_name: profile.first_name,
      last_name: profile.last_name,
      business_name: profile.business_name,
      business_type: profile.business_type,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      postal_code: profile.postal_code,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  // 8. Generate signed JWT access token
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const accessToken = jwt.sign(
    { sub: account.id, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn, algorithm: 'HS256' }
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    user,
  };
}

/**
 * getCurrentUserProfile(authId)
 *
 * Retrieves the authenticated user's account and profile information.
 * Uses explicit Prisma select queries.
 *
 * Invariants:
 *   - Identity is determined strictly by authId (from req.user.id).
 *   - Never returns password_hash, password, or sensitive internal data.
 *   - Rejects inactive accounts with 401.
 *   - Rejects missing or inconsistent profiles with 403.
 *
 * @param {string} authId - The authenticated account's auth UUID
 * @returns {object} Sanitized profile data
 */
async function getCurrentUserProfile(authId) {
  // 1. Fetch account using explicit select statement
  const account = await prisma.auth.findUnique({
    where: { id: authId },
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      email_verified: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!account) {
    const err = new Error('Account not found');
    err.statusCode = 401;
    throw err;
  }

  if (!account.is_active) {
    const err = new Error('Account is deactivated');
    err.statusCode = 401;
    throw err;
  }

  // 2. Resolve profile using database role with explicit select statements
  let profile = null;
  if (account.role === 'admin' || account.role === 'staff') {
    profile = await prisma.admin.findUnique({
      where: { auth_id: account.id },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        phone: true,
        designation: true,
        created_at: true,
        updated_at: true,
      },
    });
  } else if (account.role === 'customer') {
    profile = await prisma.users.findUnique({
      where: { auth_id: account.id },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        business_name: true,
        business_type: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postal_code: true,
        created_at: true,
        updated_at: true,
      },
    });
  } else {
    const err = new Error('Account profile is incomplete or inconsistent. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Reject missing profile
  if (!profile) {
    const err = new Error('Account profile is incomplete. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // 4. Construct sanitized profile response
  if (account.role === 'admin' || account.role === 'staff') {
    return {
      id: profile.id,
      auth_id: account.id,
      email: account.email,
      role: account.role,
      is_active: account.is_active,
      email_verified: account.email_verified,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      designation: profile.designation,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  return {
    id: profile.id,
    auth_id: account.id,
    email: account.email,
    role: account.role,
    is_active: account.is_active,
    email_verified: account.email_verified,
    first_name: profile.first_name,
    last_name: profile.last_name,
    business_name: profile.business_name,
    business_type: profile.business_type,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    postal_code: profile.postal_code,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

module.exports = { registerCustomer, loginUser, getCurrentUserProfile };
