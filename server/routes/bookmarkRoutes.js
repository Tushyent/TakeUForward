import express from 'express';
import Bookmark from '../models/Bookmark.js';
import { bookmarkLimiter } from '../middleware/rateLimiter.js';
import { applyAnonymity } from '../utils/anonymity.js';

const router = express.Router();

// @route   GET /api/bookmarks
// @desc    Get user's bookmarks
// @access  Private
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { type } = req.query; // 'post' or 'resource'
    const query = { userId: req.user._id };
    if (type) query.itemType = type;

    const bookmarks = await Bookmark.find(query)
      .populate({
        path: 'itemId',
        populate: [
          { path: 'authorId', select: 'name dept role handle isVerifiedAlumni username' },
          { path: 'clubId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    // Filter out bookmarks where the itemId was deleted from the database
    const validBookmarks = bookmarks.filter(b => b.itemId);

    // Apply anonymity check
    const safeBookmarks = validBookmarks.map(b => {
      const bObj = b.toObject();
      if (bObj.itemType === 'post') {
        bObj.itemId = applyAnonymity(b.itemId); // applyAnonymity handles the Mongoose document safely
      }
      return bObj;
    });

    res.status(200).json(safeBookmarks);
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    next(err);
  }
});

// @route   POST /api/bookmarks
// @desc    Toggle a bookmark (add if not exists, remove if exists)
// @access  Private
router.post('/', bookmarkLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  const { itemType, itemId } = req.body;
  if (!itemType || !itemId) {
    return res.status(400).json({ error: 'itemType and itemId are required' });
  }
  if (!['post', 'resource'].includes(itemType)) {
    return res.status(400).json({ error: 'Invalid itemType' });
  }

  try {
    const deleted = await Bookmark.findOneAndDelete({ userId: req.user._id, itemId });
    
    if (deleted) {
      return res.status(200).json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      try {
        await Bookmark.create({
          userId: req.user._id,
          itemType,
          itemId
        });
        return res.status(201).json({ message: 'Bookmark added', bookmarked: true });
      } catch (createErr) {
        if (createErr.code === 11000) {
          // Race condition fallback
          return res.status(200).json({ message: 'Bookmark added', bookmarked: true });
        }
        throw createErr;
      }
    }
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    next(err);
  }
});

export default router;
