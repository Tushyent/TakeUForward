import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications (paginated)
// @access  Private
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

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
