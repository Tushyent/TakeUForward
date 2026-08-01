/**
 * @file activityLogger.js
 * @description Centralized application activity logging service.
 * Records audit trails in MongoDB (ActivityLog collection) and streams
 * structured JSON logs to standard output for PaaS log aggregation (e.g. Render).
 */

import ActivityLog from '../models/ActivityLog.js';
import { logger } from '../utils/logger.js';

/**
 * Log a user or system action to both MongoDB and Render stdout.
 * @param {Object} params
 * @param {string} params.action - Action verb ('create', 'update', 'delete', 'approve', 'report', etc.)
 * @param {string} params.resource - Target entity type ('Post', 'Resource', 'User', 'Club', etc.)
 * @param {string|ObjectId} [params.resourceId] - Optional ID of the affected resource
 * @param {string} [params.description] - Human readable summary of the action
 * @param {Express.Request} [params.req] - Express request object to extract actor details
 * @param {Object} [params.details] - Additional contextual key-value metadata
 */
export const logActivity = async ({ action, resource, resourceId, description, req, details }) => {
  const userId = req?.user?._id;
  const userName = req?.user?.name || req?.user?.username || req?.user?.email || 'Unknown';
  const userRole = req?.user?.role || 'user';

  try {
    await ActivityLog.create({
      action,
      resource,
      resourceId: resourceId || undefined,
      description: description || '',
      userId,
      userName,
      userRole,
      details: details || undefined,
    });

    // Stream to stdout for live PaaS logs (Render dashboard)
    logger.info({
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      userId,
      userName,
      userRole,
      details
    }, `[ActivityLog] ${action.toUpperCase()} ${resource}: ${description || ''}`);
  } catch (err) {
    logger.error({ err: err.message, action, resource }, 'Failed to log activity to database');
  }
};
