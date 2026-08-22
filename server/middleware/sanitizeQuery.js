/**
 * @file sanitizeQuery.js
 * @description Middleware to prevent NoSQL query parameter injection/hijacking.
 * It ensures all query parameters are flat primitives and strips or casts nested objects/operators.
 */

export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      const val = req.query[key];
      if (val && typeof val === 'object') {
        // If it's a nested object or array, cast to a safe string to prevent MongoDB operator injection.
        req.query[key] = String(val);
      }
    });
  }
  next();
};
