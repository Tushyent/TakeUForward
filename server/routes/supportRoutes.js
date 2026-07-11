import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { generatePresignedUrl, validateObjectSize } from '../config/s3.js';
import { supportTicketLimiter } from '../middleware/rateLimiter.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logActivity } from '../services/activityLogger.js';
import { logger } from '../utils/logger.js';
import { requireSystemAdmin } from '../middleware/requireSystemAdmin.js';

const router = express.Router();

// POST /api/support/upload-url
router.post('/upload-url', supportTicketLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed for screenshots.' });
    }

    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);
    res.status(200).json({ uploadUrl, fileUrl });
  } catch (err) {
    logger.error('Error generating presigned URL for support screenshot:', err);
    next(err);
  }
});

// POST /api/support
router.post('/', supportTicketLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { title, description, category, pageContext, screenshotUrl, displayNamePublicly } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    if (screenshotUrl) {
      // Extract S3 key from fileUrl (assumes https://bucket.s3.region.amazonaws.com/key format)
      const keyMatch = screenshotUrl.split('amazonaws.com/');
      if (keyMatch.length === 2) {
        const key = keyMatch[1];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit for screenshots
        const sizeValidation = await validateObjectSize(key, MAX_SIZE);
        if (!sizeValidation.valid) {
          return res.status(400).json({ error: sizeValidation.error || 'File size exceeds 5MB limit. The uploaded file has been discarded.' });
        }
      }
    }

    const ticket = await SupportTicket.create({
      authorId: req.user._id,
      title,
      description,
      category,
      pageContext,
      screenshotUrl,
      displayNamePublicly: Boolean(displayNamePublicly)
    });

    await logActivity({ action: 'create', resource: 'SupportTicket', resourceId: ticket._id, description: 'Created a support ticket', req, details: { subject: ticket.title } });

    res.status(201).json(ticket);
  } catch (err) {
    logger.error('Error creating support ticket:', err);
    next(err);
  }
});

// GET /api/support
router.get('/', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { status, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('authorId', 'name username handle email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await SupportTicket.countDocuments(query);

    res.status(200).json({
      tickets,
      totalCount,
      hasMore: skip + tickets.length < totalCount
    });
  } catch (err) {
    logger.error('Error fetching support tickets:', err);
    next(err);
  }
});

// PATCH /api/support/:id/status
router.patch('/:id/status', requireSystemAdmin, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'wont_fix'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('authorId', 'name username handle email role');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await logActivity({ action: 'update', resource: 'SupportTicket', resourceId: ticket._id, description: `Updated ticket status to ${req.body.status}`, req });

    res.status(200).json(ticket);
  } catch (err) {
    logger.error('Error updating support ticket status:', err);
    next(err);
  }
});

export default router;
