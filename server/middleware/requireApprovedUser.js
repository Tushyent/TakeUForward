/**
 * @file requireApprovedUser.js
 * @description Middleware enforcing account-level access gates:
 *
 * Gate 1 — Account suspension: If isApproved is explicitly false on ANY role,
 *           the account is suspended and all API access is blocked, regardless
 *           of whether the user already has a valid session. This allows admins
 *           to immediately disable any account without waiting for session expiry.
 *
 * Gate 2 — Unverified alumni: Alumni users who haven't been approved yet
 *           (isVerifiedAlumni === false) are restricted from general API access
 *           while their documents are under review by a System Admin.
 *
 * Both gates allow the essential auth routes (/api/auth/me, /api/auth/logout)
 * so users can still check their status and log out.
 */

const APPROVED_PATHS = [
  '/api/auth/me',
  '/api/auth/logout',
];

/**
 * Checks whether the incoming request URL matches an approved (always-allowed) path.
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isApprovedPath(req) {
  return APPROVED_PATHS.some(p => req.originalUrl.startsWith(p));
}

/**
 * Express middleware to enforce account approval and alumni verification gating.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const requireApprovedUser = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(); // requireAuth handled this already; don't double-block
  }

  const user = req.user;

  // Gate 1: Suspended accounts.
  // isApproved is a tri-state: true (active), false (suspended), undefined (legacy active).
  // Only an explicit false triggers suspension; undefined is treated as approved.
  if (user.isApproved === false && !user.isPlatformAdmin) {
    if (isApprovedPath(req)) return next();
    return res.status(403).json({
      error: { message: 'Your account has been suspended. Contact the platform administrator.' }
    });
  }

  // Gate 2: Unverified alumni.
  if (user.role === 'alumni' && !user.isVerifiedAlumni && !user.isPlatformAdmin) {
    if (isApprovedPath(req)) return next();
    return res.status(403).json({
      error: { message: 'Account pending alumni verification. Please wait for admin approval.' }
    });
  }

  next();
};
