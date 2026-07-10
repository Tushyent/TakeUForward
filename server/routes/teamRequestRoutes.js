import express from 'express';
import TeamRequest from '../models/TeamRequest.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter, applyTeamLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const maskContactInfo = (request, currentUserId) => {
  const reqObj = request.toObject ? request.toObject() : request;
  const currentUserIdStr = currentUserId ? currentUserId.toString() : 'guest';
  const isAuthor = reqObj.authorId && reqObj.authorId._id && reqObj.authorId._id.toString() === currentUserIdStr;
  
  if (!isAuthor) {
    if (reqObj.authorId) {
      delete reqObj.authorId.handle;
      delete reqObj.authorId.username;
    }
    if (reqObj.applicants) {
      reqObj.applicants.forEach(app => {
        if (app.userId && app.userId._id.toString() !== currentUserIdStr) {
          delete app.userId.handle;
          delete app.userId.username;
        }
      });
    }
  }
  return reqObj;
};

// GET /api/team-requests
router.get('/', async (req, res, next) => {
  try {
    const { eventType, skill, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    const query = { status: 'open', isHidden: { $ne: true } };
    if (eventType) query.eventType = eventType;
    if (skill) {
      const safeSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.skillsNeeded = { $regex: new RegExp(safeSkill, 'i') };
    }

    const requests = await TeamRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni')
      .populate('applicants.userId', 'name dept role handle username isVerifiedAlumni');

    const maskedRequests = requests.map(r => maskContactInfo(r, req.user ? req.user._id : null));
    res.status(200).json(maskedRequests);
  } catch (err) {
    logger.error('Error fetching team requests:', err);
    next(err);
  }
});

// POST /api/team-requests
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { eventName, eventType, skillsNeeded, teamSizeNeeded, description } = req.body;

    if (!eventName || !eventType || !teamSizeNeeded || !description) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    const teamRequest = await TeamRequest.create({
      authorId: req.user._id,
      eventName,
      eventType,
      skillsNeeded: skillsNeeded || [],
      teamSizeNeeded: Number(teamSizeNeeded),
      description
    });

    const populatedRequest = await TeamRequest.findById(teamRequest._id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni');

    res.status(201).json(maskContactInfo(populatedRequest, req.user._id));
  } catch (err) {
    logger.error('Error creating team request:', err);
    next(err);
  }
});

// POST /api/team-requests/:id/apply
router.post('/:id/apply', applyTeamLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { message } = req.body;
    
    const teamRequest = await TeamRequest.findById(req.params.id);
    if (!teamRequest) return res.status(404).json({ error: { message: 'Team request not found' } });

    if (teamRequest.status !== 'open') {
      return res.status(400).json({ error: { message: 'This request is no longer open for applications' } });
    }

    if (teamRequest.authorId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'You cannot apply to your own request' } });
    }

    const hasApplied = teamRequest.applicants.some(a => a.userId && a.userId.toString() === req.user._id.toString());
    if (hasApplied) {
      return res.status(400).json({ error: { message: 'You have already applied to this request' } });
    }

    teamRequest.applicants.push({
      userId: req.user._id,
      message: message || ''
    });

    await teamRequest.save();

    const updatedRequest = await TeamRequest.findById(req.params.id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni')
      .populate('applicants.userId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(maskContactInfo(updatedRequest, req.user._id));
  } catch (err) {
    logger.error('Error applying to team request:', err);
    next(err);
  }
});

// POST /api/team-requests/:id/close
router.post('/:id/close', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const teamRequest = await TeamRequest.findById(req.params.id);
    if (!teamRequest) return res.status(404).json({ error: { message: 'Team request not found' } });

    if (teamRequest.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Only the author can close this request' } });
    }

    teamRequest.status = 'closed';
    await teamRequest.save();

    const updatedRequest = await TeamRequest.findById(req.params.id)
      .populate('authorId', 'name dept role handle username isVerifiedAlumni')
      .populate('applicants.userId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(maskContactInfo(updatedRequest, req.user._id));
  } catch (err) {
    logger.error('Error closing team request:', err);
    next(err);
  }
});

export default router;
