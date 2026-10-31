const { registerSchema, loginSchema } = require('./auth.schema');
const { registerCustomer, loginUser, getCurrentUserProfile } = require('./auth.service');

/**
 * POST /api/auth/register
 *
 * Public endpoint — no authentication required.
 * Creates a Customer account only.
 *
 * Request body is validated and stripped by registerSchema before
 * it reaches the service layer. Fields not declared in the schema
 * (role, is_active, email_verified, password_hash) are silently removed.
 */
const register = async (req, res, next) => {
  try {
    // 1. Validate and normalize — throws ZodError if invalid
    //    .strip() is Zod's default: unknown keys are dropped here.
    //    role, is_active, email_verified, password_hash never reach the service.
    const validated = registerSchema.parse(req.body);

    // 2. Delegate to service (hashing, transaction, duplicate check)
    const customer = await registerCustomer(validated);

    // 3. 201 Created — response contains no password_hash
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: customer,
    });
  } catch (err) {
    // Forward to centralized error handler:
    //   - ZodError     → 422 Validation failed
    //   - 409 duplicate → forwarded with statusCode
    //   - Prisma P2002  → 409 (fallback in error middleware)
    //   - Anything else → 500
    next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Public endpoint — authenticates Admin, Staff, or Customer accounts.
 *
 * Request body:
 *   - email
 *   - password
 *
 * Security:
 *   - Validated & normalized by loginSchema (Zod)
 *   - Extraneous fields (e.g. role) are stripped
 *   - Returns signed JWT and sanitized user profile
 */
const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await loginUser(validated);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 *
 * Protected endpoint — requires authentication.
 * Returns the current authenticated user's account and profile information.
 *
 * Security:
 *   - Identity is determined strictly from req.user.id set by authenticateToken
 *   - Never accepts or trusts client-supplied account IDs from query, body, or headers
 *   - Never returns password_hash, passwords, or sensitive internal data
 */
const getMe = async (req, res, next) => {
  try {
    const profile = await getCurrentUserProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 *
 * Protected endpoint — requires authentication via authenticateToken.
 * Confirms logout in a stateless JWT architecture.
 *
 * Invariants:
 *   - The backend is stateless; the client must delete its local token.
 *   - Does not delete, modify, or deactivate the account.
 *   - Does not return any JWT token.
 */
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };
