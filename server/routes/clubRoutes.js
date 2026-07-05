import express from 'express';
import Club from '../models/Club.js';
import Post from '../models/Post.js';
import Community from '../models/Community.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const clubs = await Club.find().select('-adminIds').sort({ createdAt: -1 });
    res.json(clubs);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/clubs/:id
// @desc    Get a single club and its announcements
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: { message: 'Club not found' } });
    }

    const announcements = await Post.find({ clubId: club._id, type: 'announcement' })
      .populate('authorId', 'name role')
      .populate('communityId', 'name')
      .sort({ createdAt: -1 });

    res.json({ club, announcements });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/clubs/:id/posts
// @desc    Create an announcement post for a club
// @access  Private (Club Admin only)
router.post('/:id/posts', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const clubId = req.params.id;
    const { content, title } = req.body;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: { message: 'Club not found' } });
    }

    // Check if logged-in user is an admin for this club
    if (!club.adminIds.some(adminId => adminId.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: { message: 'Not authorized to post as this club' } });
    }

    // Find the 'General' community for announcements
    const generalCommunity = await Community.findOne({ name: 'General' });
    if (!generalCommunity) {
      return next(new Error('General community not found'));
    }

    const post = await Post.create({
      authorId: req.user._id,
      communityId: generalCommunity._id,
      clubId: club._id,
      type: 'announcement',
      content: title ? `**${title}**\n\n${content}` : content, // Optional title combined with content
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/clubs/:id/analytics
// @desc    Get club analytics (read-only aggregation)
// @access  Private (Club Admin only)
router.get('/:id/analytics', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const clubId = req.params.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: { message: 'Club not found' } });
    }

    // Check if logged-in user is an admin for this club
    if (!club.adminIds.some(adminId => adminId.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: { message: 'Not authorized to view analytics for this club' } });
    }

    // Read-only aggregation: 0 DB writes
    const stats = await Post.aggregate([
      { $match: { clubId: club._id } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalUpvotes: { $sum: { $size: { $ifNull: ["$upvotes", []] } } },
          totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } }
        }
      }
    ]);

    const topPost = await Post.aggregate([
      { $match: { clubId: club._id } },
      { $addFields: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { upvotesCount: -1 } },
      { $limit: 1 }
    ]);

    const result = {
      totalPosts: stats.length > 0 ? stats[0].totalPosts : 0,
      totalUpvotes: stats.length > 0 ? stats[0].totalUpvotes : 0,
      totalComments: stats.length > 0 ? stats[0].totalComments : 0,
      topPost: topPost.length > 0 ? topPost[0] : null
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
