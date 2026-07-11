import { isSystemAdminUser } from '../utils/userIdentity.js';

export const requireSystemAdmin = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  if (!isSystemAdminUser(req.user)) {
    return res.status(403).json({ error: { message: 'System admin access required' } });
  }

  next();
};
