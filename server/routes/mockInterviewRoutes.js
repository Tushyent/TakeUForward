import express from 'express';
import MockInterviewRequest from '../models/MockInterviewRequest.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logActivity } from '../services/activityLogger.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/mock-interviews
// List open mock interview requests (filterable by company)
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { company, status = 'open', page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    const query = { status };

    if (company) {
      const safeCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.targetCompany = { $regex: new RegExp(safeCompany, 'i') };
    }

    const requests = await MockInterviewRequest.find(query)
      .populate('requesterId', 'name handle dept year username')
      .populate('matchedMentorId', 'name handle currentCompany isVerifiedAlumni username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(requests);
  } catch (err) {
    logger.error('Error fetching mock interview requests:', err);
    next(err);
  }
});

// GET /api/mock-interviews/my-requests
// List requests made by the current user
router.get('/my-requests', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const requests = await MockInterviewRequest.find({ requesterId: req.user._id })
      .populate('matchedMentorId', 'name handle currentCompany isVerifiedAlumni username')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    logger.error('Error fetching my mock interview requests:', err);
    next(err);
  }
});

// POST /api/mock-interviews
// Create a new mock interview request (students only)
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: { message: 'Only students can create mock interview requests' } });
  }

  try {
    const { targetCompany, requestType } = req.body;
    if (!targetCompany) return res.status(400).json({ error: { message: 'Target company is required' } });
    if (!['mock_interview', 'resume_review', 'both'].includes(requestType)) {
      return res.status(400).json({ error: { message: 'Invalid requestType' } });
    }

    // Check if user already has an open request for this company
    const existing = await MockInterviewRequest.findOne({ 
      requesterId: req.user._id, 
      targetCompany: { $regex: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: 'open'
    });

    if (existing) {
      return res.status(400).json({ error: { message: 'You already have an open request for this company' } });
    }

    const request = await MockInterviewRequest.create({
      requesterId: req.user._id,
      targetCompany,
      requestType
    });

    await logActivity({ action: 'create', resource: 'MockInterviewRequest', resourceId: request._id, description: 'Requested a mock interview', req, details: { role: request.targetRole, company: request.targetCompany } });

    res.status(201).json(request);
  } catch (err) {
    logger.error('Error creating mock interview request:', err);
    next(err);
  }
});

// POST /api/mock-interviews/:id/match
// Match an alumni to a request (verified alumni only)
router.post('/:id/match', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  if (!req.user.isVerifiedAlumni || req.user.role !== 'alumni') {
    return res.status(403).json({ error: { message: 'Only verified alumni can match with mock interview requests' } });
  }

  try {
    const request = await MockInterviewRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: { message: 'Request not found' } });
    if (request.status !== 'open') return res.status(400).json({ error: { message: 'Request is not open' } });

    // Alumni must match the target company
    if (req.user.currentCompany?.toLowerCase() !== request.targetCompany.toLowerCase()) {
      return res.status(403).json({ error: { message: 'You can only match requests for your current company' } });
    }

    request.status = 'matched';
    request.matchedMentorId = req.user._id;
    await request.save();

    await logActivity({ action: 'match', resource: 'MockInterviewRequest', resourceId: request._id, description: 'Matched to a mock interview request', req });

    await request.populate('requesterId', 'name handle dept year username');
    await request.populate('matchedMentorId', 'name handle currentCompany isVerifiedAlumni username');

    res.status(200).json(request);
  } catch (err) {
    logger.error('Error matching mock interview request:', err);
    next(err);
  }
});

// PATCH /api/mock-interviews/:id/close
// Close a request (requester only)
router.patch('/:id/close', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const request = await MockInterviewRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: { message: 'Request not found' } });
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only close your own requests' } });
    }

    request.status = 'closed';
    await request.save();

    await logActivity({ action: 'update', resource: 'MockInterviewRequest', resourceId: request._id, description: 'Closed a mock interview request', req });

    res.status(200).json(request);
  } catch (err) {
    logger.error('Error closing mock interview request:', err);
    next(err);
  }
});

export default router;
