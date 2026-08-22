import express from 'express';
import LostFoundItem from '../models/LostFoundItem.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { generatePresignedUrl } from '../config/s3.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// GET /api/lost-found
router.get('/', async (req, res, next) => {
  try {
    const { type, locationTag, status, search, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (locationTag) {
      const safeLocation = locationTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.locationTag = { $regex: new RegExp(safeLocation, 'i') };
    }
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { itemName: { $regex: new RegExp(safeSearch, 'i') } },
        { description: { $regex: new RegExp(safeSearch, 'i') } },
      ];
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

    if (itemName.trim().length > 200) {
      return res.status(400).json({ error: { message: 'Item name must be 200 characters or fewer' } });
    }
    if (description.trim().length > 2000) {
      return res.status(400).json({ error: { message: 'Description must be 2000 characters or fewer' } });
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

    await logActivity({ action: 'create', resource: 'LostFoundItem', resourceId: item._id, description: 'Posted a lost/found item', req, details: { itemName: item.itemName, category: item.category } });

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

    await logActivity({ action: 'update', resource: 'LostFoundItem', resourceId: item._id, description: 'Marked lost/found item as resolved', req, details: { itemName: item.itemName } });

    const updatedItem = await LostFoundItem.findById(req.params.id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(updatedItem);
  } catch (err) {
    logger.error('Error resolving lost/found item:', err);
    next(err);
  }
});

// DELETE /api/lost-found/:id
router.delete('/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { message: 'Item not found' } });

    // Allow deletion if the user is a platform admin OR the original reporter
    if (!req.user.isPlatformAdmin && item.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this item' } });
    }

    await LostFoundItem.findByIdAndDelete(req.params.id);
    
    const actionDesc = req.user.isPlatformAdmin && item.authorId.toString() !== req.user._id.toString() 
      ? 'Admin deleted a lost/found item' 
      : 'User deleted their own lost/found item';
    await logActivity({ action: 'delete', resource: 'LostFoundItem', resourceId: req.params.id, description: actionDesc, req });
    
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }
    next(err);
  }
});

// POST /api/lost-found/:id/report - Report item
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: { message: 'Reason is required' } });
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    const alreadyReported = item.reports && item.reports.some(r => r.reporterId.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You already reported this item' } });
    }

    if (!item.reports) item.reports = [];
    item.reports.push({ reporterId: req.user._id, reason });
    await item.save();

    await logActivity({ action: 'report', resource: 'LostFoundItem', resourceId: item._id, description: 'Reported a lost/found listing', req });

    res.json({ message: 'Item reported successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
