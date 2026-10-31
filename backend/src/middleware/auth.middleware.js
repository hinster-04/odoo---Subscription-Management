const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Resolves the profile record for a given auth account based on its role.
 * - admin / staff → admin profile
 * - customer       → users profile
 *
 * Returns the profile id, or null if the profile is missing (inconsistent state).
 */
async function resolveProfile(authId, role) {
  if (role === 'admin' || role === 'staff') {
    const profile = await prisma.admin.findUnique({
      where: { auth_id: authId },
      select: { id: true },
    });
    return profile ? profile.id : null;
  }

  if (role === 'customer') {
    const profile = await prisma.users.findUnique({
      where: { auth_id: authId },
      select: { id: true },
    });
    return profile ? profile.id : null;
  }

  return null;
}

/**
 * authenticateToken
 *
 * 1. Reads Authorization header (Bearer <token>).
 * 2. Rejects missing / malformed tokens with 401.
 * 3. Verifies JWT signature and expiration.
 * 4. Extracts `sub` (auth UUID) and `role` from the payload.
 * 5. Retrieves the account from the database and checks is_active.
 * 6. Resolves the profile id based on the database role.
 * 7. Attaches a sanitized req.user object — no passwords, no hashes.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify signature + expiration — throws if invalid or expired
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    const { sub: authId } = payload;

    // Always re-check the database — a deactivated account must be rejected
    // even if the JWT is otherwise valid
    const account = await prisma.auth.findUnique({
      where: { id: authId },
      select: {
        id: true,
        role: true,
        is_active: true,
      },
    });

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (!account.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Resolve profile — enforce account-role consistency
    const profileId = await resolveProfile(authId, account.role);

    if (profileId === null) {
      // Account exists but its profile record is missing — inconsistent state
      return res.status(403).json({
        success: false,
        message: 'Account profile is incomplete. Please contact support.',
      });
    }

    // Sanitized user object — no credentials, no hashes
    req.user = {
      id: account.id,
      role: account.role,
      profileId,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticateToken;
