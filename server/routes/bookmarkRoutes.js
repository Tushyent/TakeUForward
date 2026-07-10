import express from 'express';
import Bookmark from '../models/Bookmark.js';
import { bookmarkLimiter } from '../middleware/rateLimiter.js';
import { applyAnonymity } from '../utils/anonymity.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/bookmarks
// @desc    Get user's bookmarks
// @access  Private
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { type, page: pageQuery, limit: limitQuery } = req.query; // 'post' or 'resource'
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    logger.error('Error fetching bookmarks:', err);
    next(err);
  }
});

// @route   POST /api/bookmarks
// @desc    Toggle a bookmark (add if not exists, remove if exists)
// @access  Private
router.post('/', bookmarkLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  const { itemType, itemId } = req.body;
  if (!itemType || !itemId) {
    return res.status(400).json({ error: { message: 'itemType and itemId are required' } });
  }
  if (!['post', 'resource'].includes(itemType)) {
    return res.status(400).json({ error: { message: 'Invalid itemType' } });
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
    logger.error('Error toggling bookmark:', err);
    next(err);
  }
});

export default router;
