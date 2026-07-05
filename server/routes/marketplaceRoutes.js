import express from 'express';
import MarketplaceItem from '../models/MarketplaceItem.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/marketplace - List items
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { category, status, page: pageQuery, limit: limitQuery } = req.query;
    const { page, limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const items = await MarketplaceItem.find(query)
      .populate('sellerId', 'name username dept year handle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplace - Create item
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { title, description, category, price, condition } = req.body;
    
    if (!title || !description || !category || price === undefined || !condition) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }

    const newItem = new MarketplaceItem({
      sellerId: req.user._id,
      title,
      description,
      category,
      price: Number(price),
      condition
    });

    await newItem.save();
    
    const populatedItem = await MarketplaceItem.findById(newItem._id)
      .populate('sellerId', 'name username dept year handle');
      
    res.status(201).json(populatedItem);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/marketplace/:id/sold - Mark as sold
router.patch('/:id/sold', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    if (item.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized to mark this item as sold' } });
    }

    item.status = 'sold';
    await item.save();

    const populatedItem = await MarketplaceItem.findById(item._id)
      .populate('sellerId', 'name username dept year handle');

    res.json(populatedItem);
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplace/:id/report - Report item
router.post('/:id/report', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: { message: 'Reason is required' } });
    }

    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    const alreadyReported = item.reports.some(r => r.reporterId.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You already reported this item' } });
    }

    item.reports.push({ reporterId: req.user._id, reason });
    await item.save();

    res.json({ message: 'Item reported successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
