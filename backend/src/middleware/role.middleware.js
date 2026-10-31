/**
 * authorizeRoles(...roles)
 *
 * Factory that returns Express middleware enforcing role-based access control.
 *
 * Usage:
 *   router.post('/staff', authenticateToken, authorizeRoles('admin'), createStaff);
 *
 * Rules:
 *   - Must be used AFTER authenticateToken (relies on req.user being set).
 *   - Unauthenticated (no req.user) → 401.
 *   - Authenticated but wrong role   → 403.
 *
 * Supported roles: 'admin' | 'staff' | 'customer'
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: requires one of [${roles.join(', ')}] role`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
