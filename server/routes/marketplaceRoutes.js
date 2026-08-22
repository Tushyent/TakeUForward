import express from 'express';
import MarketplaceItem from '../models/MarketplaceItem.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// GET /api/marketplace - List items
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  try {
    const { category, status, search, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      // Escape user-controlled regex metacharacters to prevent ReDoS.
      const safeSearch = String(search).slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: new RegExp(safeSearch, 'i') };
    }

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
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  try {
    const { title, description, category, price, condition } = req.body;
    
    if (!title || !description || !category || price === undefined || !condition) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: { message: 'Title must be 200 characters or fewer' } });
    }
    if (description.length > 2000) {
      return res.status(400).json({ error: { message: 'Description must be 2000 characters or fewer' } });
    }

    const validCategories = ['book', 'cycle', 'electronics', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: { message: 'Invalid category' } });
    }

    const validConditions = ['new', 'like_new', 'good', 'fair'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ error: { message: 'Invalid condition' } });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: { message: 'Price must be a non-negative number' } });
    }

    const newItem = new MarketplaceItem({
      sellerId: req.user._id,
      title,
      description,
      category,
      price: numericPrice,
      condition
    });

    await newItem.save();

    await logActivity({ action: 'create', resource: 'MarketplaceItem', resourceId: newItem._id, description: 'Listed an item for sale', req, details: { title: newItem.title, price: newItem.price } });
    
    const populatedItem = await MarketplaceItem.findById(newItem._id)
      .populate('sellerId', 'name username dept year handle');
      
    res.status(201).json(populatedItem);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/marketplace/:id/sold - Mark as sold
router.patch('/:id/sold', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
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

    await logActivity({ action: 'update', resource: 'MarketplaceItem', resourceId: item._id, description: 'Marked item as sold', req, details: { title: item.title } });

    const populatedItem = await MarketplaceItem.findById(item._id)
      .populate('sellerId', 'name username dept year handle');

    res.json(populatedItem);
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplace/:id/report - Report item
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
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

    await logActivity({ action: 'report', resource: 'MarketplaceItem', resourceId: item._id, description: 'Reported a marketplace listing', req });

    res.json({ message: 'Item reported successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/marketplace/:id
router.delete('/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { message: 'Item not found' } });

    // Allow deletion if the user is a platform admin OR the original seller
    if (!req.user.isPlatformAdmin && item.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this item' } });
    }

    await MarketplaceItem.findByIdAndDelete(req.params.id);
    
    const actionDesc = req.user.isPlatformAdmin && item.sellerId.toString() !== req.user._id.toString() 
      ? 'Admin deleted a marketplace item' 
      : 'User deleted their own marketplace item';
    await logActivity({ action: 'delete', resource: 'MarketplaceItem', resourceId: req.params.id, description: actionDesc, req });
    
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }
    next(err);
  }
});

export default router;
