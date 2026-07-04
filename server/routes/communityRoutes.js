import express from 'express';
import Community from '../models/Community.js';

const router = express.Router();

// GET /api/communities - Return all communities (no auth required)
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find({}).sort({ createdAt: -1 });
    res.status(200).json(communities);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communities/:id - Return a single community by ID
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.status(200).json(community);
  } catch (err) {
    console.error('Error fetching community by ID:', err);
    // If id is not a valid ObjectId, Mongoose will throw a CastError
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
