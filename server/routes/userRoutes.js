import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users for @mentions
// @access  Private
router.get('/search', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  const { q } = req.query;
  if (!q || q.length < 1) {
    return res.json([]); // Return empty array if query is too short
  }

  try {
    // Escape regex special chars to prevent regex injection
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeQ, 'i');

    const users = await User.find({
      $or: [
        { handle: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    })
      .select('name handle')
      .limit(5)
      .lean();

    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
