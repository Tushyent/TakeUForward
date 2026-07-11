import ActivityLog from '../models/ActivityLog.js';
import { logger } from '../utils/logger.js';

export const logActivity = async ({ action, resource, resourceId, description, req, details }) => {
  try {
    await ActivityLog.create({
      action,
      resource,
      resourceId: resourceId || undefined,
      description: description || '',
      userId: req?.user?._id,
      userName: req?.user?.name || req?.user?.username || req?.user?.email || 'Unknown',
      userRole: req?.user?.role || 'user',
      details: details || undefined,
    });
  } catch (err) {
    logger.error('Failed to log activity:', err);
  }
};
