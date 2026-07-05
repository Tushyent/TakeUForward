import express from 'express';
import LostFoundItem from '../models/LostFoundItem.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/lost-found
router.get('/', async (req, res) => {
  try {
    const { type, locationTag, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (locationTag) query.locationTag = { $regex: new RegExp(locationTag, 'i') };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const items = await LostFoundItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(items);
  } catch (err) {
    console.error('Error fetching lost/found items:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/lost-found
router.post('/', postCreationLimiter, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { type, itemName, description, locationTag, contactPreference } = req.body;

    if (!type || !itemName || !description || !locationTag) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    const item = await LostFoundItem.create({
      authorId: req.user._id,
      type,
      itemName,
      description,
      locationTag,
      contactPreference: contactPreference || 'Message me via app'
    });

    const populatedItem = await LostFoundItem.findById(item._id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(201).json(populatedItem);
  } catch (err) {
    console.error('Error creating lost/found item:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/lost-found/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { message: 'Item not found' } });

    if (item.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the author can resolve this item' } });
    }

    item.status = 'resolved';
    await item.save();

    const updatedItem = await LostFoundItem.findById(req.params.id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Error resolving lost/found item:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
