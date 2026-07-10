import express from 'express';
import Community from '../models/Community.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/communities - Return all communities (no auth required)
router.get('/', async (req, res, next) => {
  try {
    const communities = await Community.find({}).sort({ createdAt: -1 });
    res.status(200).json(communities);
  } catch (err) {
    logger.error('Error fetching communities:', err);
    next(err);
  }
});

// GET /api/communities/:id - Return a single community by ID
router.get('/:id', async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: { message: 'Community not found' } });
    }
    res.status(200).json(community);
  } catch (err) {
    logger.error('Error fetching community by ID:', err);
    // If id is not a valid ObjectId, Mongoose will throw a CastError
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Community not found' } });
    }
    next(err);
  }
});

export default router;
