/**
 * Centralized Express error handler.
 *
 * Catches errors forwarded via next(err) from any route or middleware.
 *
 * Security rules:
 *   - Never expose stack traces in production.
 *   - Never expose database internals or query details.
 *   - Prisma-specific errors are mapped to safe messages.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Always log the full error server-side (but not to the client)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err.message);
  }

  // Prisma known error codes
  if (err.code) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with that value already exists',
      });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
  }

  // Zod validation errors (v4 uses .issues, v3 uses .errors)
  if (err.name === 'ZodError') {
    const issues = err.issues ?? err.errors ?? [];
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: issues.map((e) => ({
        field: (e.path ?? []).join('.') || 'unknown',
        message: e.message,
      })),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode < 500
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
