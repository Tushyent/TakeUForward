/**
 * @file requireApprovedUser.js
 * @description Middleware restricting unverified alumni users from accessing general API endpoints
 * until their alumni status is reviewed and approved by a System Admin.
 */

const APPROVED_PATHS = [
  '/api/auth/me',
  '/api/auth/logout',
];

/**
 * Express middleware to enforce alumni account verification gating.
 * Intercepts requests from unverified alumni accounts and blocks API access with 403 Forbidden,
 * while allowing essential auth status and session management routes.
 *
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Express.NextFunction} next - Express next function
 */
export const requireApprovedUser = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'alumni' && !req.user.isVerifiedAlumni && !req.user.isPlatformAdmin) {
    const path = req.baseUrl + (req.route ? req.route.path : '');
    if (APPROVED_PATHS.some(p => req.originalUrl.startsWith(p) || path.startsWith(p))) {
      return next();
    }
    return res.status(403).json({ error: { message: 'Account pending alumni verification. Please wait for admin approval.' } });
  }
  next();
};
