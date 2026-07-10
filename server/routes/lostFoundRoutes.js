import express from 'express';
import LostFoundItem from '../models/LostFoundItem.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { generatePresignedUrl } from '../config/s3.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/lost-found
router.get('/', async (req, res, next) => {
  try {
    const { type, locationTag, status, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (locationTag) {
      const safeLocation = locationTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.locationTag = { $regex: new RegExp(safeLocation, 'i') };
    }

    const items = await LostFoundItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(items);
  } catch (err) {
    logger.error('Error fetching lost/found items:', err);
    next(err);
  }
});

// POST /api/lost-found/upload-url
router.post('/upload-url', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) return res.status(400).json({ error: { message: 'Missing file details' } });
    if (!fileType.startsWith('image/')) return res.status(400).json({ error: { message: 'Only images are allowed' } });

    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);
    res.status(200).json({ uploadUrl, fileUrl });
  } catch (err) {
    logger.error('Error generating upload url for lost-found:', err);
    next(err);
  }
});

// POST /api/lost-found
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { type, itemName, description, locationTag, contactPreference, whatsappNumber, dateLostFound, imageUrl, proofRequired } = req.body;

    if (!type || !itemName || !itemName.trim() || !description || !description.trim() || !locationTag || !locationTag.trim()) {
      return res.status(400).json({ error: { message: 'Required fields missing or empty' } });
    }

    const item = await LostFoundItem.create({
      authorId: req.user._id,
      type,
      itemName,
      description,
      locationTag,
      whatsappNumber,
      dateLostFound: dateLostFound || Date.now(),
      imageUrl,
      proofRequired,
      contactPreference: contactPreference || 'Message me via app'
    });

    const populatedItem = await LostFoundItem.findById(item._id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(201).json(populatedItem);
  } catch (err) {
    logger.error('Error creating lost/found item:', err);
    next(err);
  }
});

// POST /api/lost-found/:id/resolve
router.post('/:id/resolve', async (req, res, next) => {
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
    logger.error('Error resolving lost/found item:', err);
    next(err);
  }
});

export default router;
