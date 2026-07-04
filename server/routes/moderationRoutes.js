import express from 'express';
import Post from '../models/Post.js';

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
// @desc    Get all reported/hidden posts
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

    res.json(flaggedPosts);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/moderation/:postId/resolve
// @desc    Resolve a reported post (dismiss or remove)
// @access  Private (Platform Admin)
router.post('/:postId/resolve', requirePlatformAdmin, async (req, res, next) => {
  try {
    const { action } = req.body;
    
    if (action !== 'dismiss' && action !== 'remove') {
      return res.status(400).json({ error: { message: 'Invalid action. Must be dismiss or remove.' } });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    if (action === 'dismiss') {
      post.reports = [];
      post.isHidden = false;
      await post.save();
      return res.json({ message: 'Post dismissed successfully', post });
    } 
    
    if (action === 'remove') {
      await Post.findByIdAndDelete(req.params.postId);
      return res.json({ message: 'Post removed successfully' });
    }

  } catch (err) {
    next(err);
  }
});

export default router;
