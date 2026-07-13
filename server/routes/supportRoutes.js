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
    const { title, description, category, pageContext, screenshotUrls, displayNamePublicly } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    if (screenshotUrls && Array.isArray(screenshotUrls) && screenshotUrls.length > 0) {
      if (screenshotUrls.length > 4) {
        return res.status(400).json({ error: 'Maximum 4 screenshots allowed.' });
      }
      for (const url of screenshotUrls) {
        // Extract S3 key from fileUrl
        const keyMatch = url.split('amazonaws.com/');
        if (keyMatch.length === 2) {
          const key = keyMatch[1];
          const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit for screenshots
          const sizeValidation = await validateObjectSize(key, MAX_SIZE);
          if (!sizeValidation.valid) {
            return res.status(400).json({ error: sizeValidation.error || 'A file size exceeds the 5MB limit. Upload discarded.' });
          }
        }
      }
    }

    const ticket = await SupportTicket.create({
      authorId: req.user._id,
      title,
      description,
      category,
      pageContext,
      screenshotUrls: screenshotUrls || [],
      displayNamePublicly: Boolean(displayNamePublicly)
    });

    await logActivity({ action: 'create', resource: 'SupportTicket', resourceId: ticket._id, description: 'Created a support ticket', req, details: { subject: ticket.title } });

    res.status(201).json(ticket);
  } catch (err) {
    logger.error('Error creating support ticket:', err);
    next(err);
  }
});

// GET /api/support/my-tickets
router.get('/my-tickets', supportTicketLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);

    const tickets = await SupportTicket.find({ authorId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await SupportTicket.countDocuments({ authorId: req.user._id });

    res.status(200).json({
      tickets,
      totalCount,
      hasMore: skip + tickets.length < totalCount
    });
  } catch (err) {
    logger.error('Error fetching user support tickets:', err);
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

// POST /api/support/:id/reply
router.post('/:id/reply', requireSystemAdmin, async (req, res, next) => {
  try {
    const { replyText, updateStatusTo } = req.body;
    
    if (!replyText) {
      return res.status(400).json({ error: 'replyText is required' });
    }

    const ticket = await SupportTicket.findById(req.params.id)
      .populate('authorId', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const recipientEmail = ticket.authorId?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Ticket author has no email address' });
    }

    // Attempt to send in-app notification
    const Notification = (await import('../models/Notification.js')).default;
    
    await Notification.create({
      userId: ticket.authorId._id,
      type: 'message',
      refId: ticket._id,
      targetPath: '/support',
      actorName: 'Support Team',
      contentPreview: `Reply to "${ticket.title}": ${replyText.slice(0, 100)}`
    });

    // Update ticket status and adminReplies
    const updateData = { 
      $push: { adminReplies: { text: replyText } }
    };
    if (updateStatusTo) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'wont_fix'];
      if (validStatuses.includes(updateStatusTo)) {
        updateData.$set = { status: updateStatusTo };
      }
    }

    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('authorId', 'name username handle email role');

    await logActivity({ 
      action: 'update', 
      resource: 'SupportTicket', 
      resourceId: ticket._id, 
      description: `Replied to ticket via in-app notification to ${ticket.authorId.email}`, 
      req 
    });

    res.status(200).json({ message: 'Reply sent successfully via in-app notification', ticket: updatedTicket });
  } catch (err) {
    logger.error('Error replying to support ticket:', err);
    next(err);
  }
});

export default router;
