/**
 * @file requireAuth.js
 * @description Middleware to enforce session authentication check.
 * Rejects unauthenticated guest requests with 401 Unauthorized.
 */

export const requireAuth = (req, res, next) => {
  if (req.path === '/health' || req.originalUrl === '/api/health' || req.originalUrl === '/health') {
    return next();
  }
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }
  next();
};
