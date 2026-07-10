import express from 'express';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/push/subscribe
router.post('/subscribe', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  const subscription = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: { message: 'Invalid subscription object' } });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    
    // Check if subscription already exists to avoid duplicates
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.status(200).json({ message: 'Push subscription saved' });
  } catch (err) {
    logger.error('Error saving push subscription:', err);
    next(err);
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: { message: 'Endpoint is required to unsubscribe' } });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    
    user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    await user.save();
    
    res.status(200).json({ message: 'Push subscription removed' });
  } catch (err) {
    logger.error('Error removing push subscription:', err);
    next(err);
  }
});

export default router;
