import express from 'express';
import Post from '../models/Post.js';
import Review from '../models/Review.js';
import { applyAnonymity } from '../utils/anonymity.js';

const router = express.Router();

// Middleware to ensure user is platform admin
const requirePlatformAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }
  if (!req.user.isPlatformAdmin) {
    return res.status(403).json({ error: { message: 'Not authorized as platform admin' } });
  }
  next();
};

// @route   GET /api/moderation/queue
// @desc    Get all reported/hidden posts and reviews
// @access  Private (Platform Admin)
router.get('/queue', requirePlatformAdmin, async (req, res, next) => {
  try {
    const flaggedPosts = await Post.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ 'reports.length': -1, createdAt: -1 });

    const flaggedReviews = await Review.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ 'reports.length': -1, createdAt: -1 });

    const safePosts = flaggedPosts.map(post => ({ type: 'post', ...applyAnonymity(post) }));
    const safeReviews = flaggedReviews.map(review => ({ type: 'review', ...applyAnonymity(review) }));

    const combined = [...safePosts, ...safeReviews].sort((a, b) => b.reports.length - a.reports.length || new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/moderation/:itemId/resolve
// @desc    Resolve a reported post or review (dismiss or remove)
// @access  Private (Platform Admin)
router.post('/:itemId/resolve', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { action, type = 'post' } = req.body;
    
    if (action !== 'dismiss' && action !== 'remove') {
      return res.status(400).json({ error: { message: 'Invalid action. Must be dismiss or remove.' } });
    }

    const Model = type === 'review' ? Review : Post;
    const item = await Model.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    if (action === 'dismiss') {
      item.reports = [];
      item.isHidden = false;
      await item.save();
      return res.json({ message: 'Item dismissed successfully', item });
    } 
    
    if (action === 'remove') {
      await Model.findByIdAndDelete(req.params.itemId);
      return res.json({ message: 'Item removed successfully' });
    }

  } catch (err) {
    next(err);
  }
});

export default router;
