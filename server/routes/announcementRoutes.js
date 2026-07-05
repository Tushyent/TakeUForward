import express from 'express';
import Post from '../models/Post.js';

const router = express.Router();

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    const query = { type: 'announcement', isHidden: { $ne: true } };
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const announcements = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('authorId', 'name dept role handle')
      .populate('clubId', 'name');

    res.status(200).json(announcements);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
