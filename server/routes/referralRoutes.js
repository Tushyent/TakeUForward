import express from 'express';
import ReferralRequest from '../models/ReferralRequest.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/referrals
// List open referral requests (filterable by company)
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { company, status = 'open', page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    const query = { status };

    if (company) {
      const safeCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.company = { $regex: new RegExp(safeCompany, 'i') };
    }

    const requests = await ReferralRequest.find(query)
      .populate('requesterId', 'name handle dept year username')
      .populate('matchedAlumniId', 'name handle currentCompany isVerifiedAlumni username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(requests);
  } catch (err) {
    logger.error('Error fetching referral requests:', err);
    next(err);
  }
});

// GET /api/referrals/my-requests
// List requests made by the current user
router.get('/my-requests', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const requests = await ReferralRequest.find({ requesterId: req.user._id })
      .populate('matchedAlumniId', 'name handle currentCompany isVerifiedAlumni')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    logger.error('Error fetching my referral requests:', err);
    next(err);
  }
});

// POST /api/referrals
// Create a new referral request (students only)
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: { message: 'Only students can create referral requests' } });
  }

  try {
    const { targetCompany } = req.body;
    if (!targetCompany) return res.status(400).json({ error: { message: 'Target company is required' } });

    // Check if user already has an open request for this company
    const existing = await ReferralRequest.findOne({ 
      requesterId: req.user._id, 
      targetCompany: { $regex: new RegExp(`^${targetCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: 'open'
    });

    if (existing) {
      return res.status(400).json({ error: { message: 'You already have an open request for this company' } });
    }

    const request = await ReferralRequest.create({
      requesterId: req.user._id,
      targetCompany
    });

    res.status(201).json(request);
  } catch (err) {
    logger.error('Error creating referral request:', err);
    next(err);
  }
});

// POST /api/referrals/:id/match
// Match an alumni to a request (verified alumni only)
router.post('/:id/match', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
  if (!req.user.isVerifiedAlumni || req.user.role !== 'alumni') {
    return res.status(403).json({ error: { message: 'Only verified alumni can match with referral requests' } });
  }

  try {
    const request = await ReferralRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: { message: 'Request not found' } });
    if (request.status !== 'open') return res.status(400).json({ error: { message: 'Request is not open' } });

    // Alumni must match the target company
    if (req.user.currentCompany?.toLowerCase() !== request.targetCompany.toLowerCase()) {
      return res.status(403).json({ error: { message: 'You can only match requests for your current company' } });
    }

    request.status = 'matched';
    request.matchedAlumniId = req.user._id;
    await request.save();

    await request.populate('requesterId', 'name handle dept year username');
    await request.populate('matchedAlumniId', 'name handle currentCompany isVerifiedAlumni username');

    res.status(200).json(request);
  } catch (err) {
    logger.error('Error matching referral request:', err);
    next(err);
  }
});

// PATCH /api/referrals/:id/close
// Close a request (requester only)
router.patch('/:id/close', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const request = await ReferralRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: { message: 'Request not found' } });
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only close your own requests' } });
    }

    request.status = 'closed';
    await request.save();

    res.status(200).json(request);
  } catch (err) {
    logger.error('Error closing referral request:', err);
    next(err);
  }
});

export default router;
