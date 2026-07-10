import express from 'express';
import Post from '../models/Post.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/announcements
router.get('/', async (req, res, next) => {
  try {
    const { category, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    const query = { type: 'announcement', isHidden: { $ne: true } };
    if (category) {
      query.category = category;
    }

    const announcements = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name dept role handle')
      .populate('clubId', 'name');

    res.status(200).json(announcements);
  } catch (err) {
    logger.error('Error fetching announcements:', err);
    next(err);
  }
});

export default router;
