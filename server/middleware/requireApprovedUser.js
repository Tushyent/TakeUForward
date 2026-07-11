const APPROVED_PATHS = [
  '/api/auth/me',
  '/api/auth/logout',
];

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
