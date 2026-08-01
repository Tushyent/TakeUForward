import ActivityLog from '../models/ActivityLog.js';
import { logger } from '../utils/logger.js';

export const logActivity = async ({ action, resource, resourceId, description, req, details }) => {
  try {
    const logData = {
      action,
      resource,
      resourceId: resourceId || undefined,
      userId: req?.user?._id,
      userRole: req?.user?.role || 'user',
      details: details || undefined,
    };
    logger.info(logData, `[ACTION] ${action.toUpperCase()} ${resource}: ${description || action}`);

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
    logger.error({ err, action, resource }, 'Failed to log activity');
  }
};
