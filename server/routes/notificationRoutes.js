import express from 'express';
import Notification from '../models/Notification.js';
import { getPaginationParams } from '../utils/paginationUtils.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications (paginated)
// @access  Private
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const { page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.post('/:id/read', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default router;
