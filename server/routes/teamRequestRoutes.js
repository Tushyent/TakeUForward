import express from 'express';
import TeamRequest from '../models/TeamRequest.js';
import { postCreationLimiter, applyTeamLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/team-requests
router.get('/', async (req, res) => {
  try {
    const { eventType, skill, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (eventType) query.eventType = eventType;
    if (skill) query.skillsNeeded = { $regex: new RegExp(skill, 'i') };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const requests = await TeamRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('authorId', 'name dept role handle username isVerifiedAlumni')
      .populate('applicants.userId', 'name dept role handle username isVerifiedAlumni');

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching team requests:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/team-requests
router.post('/', postCreationLimiter, async (req, res) => {
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

    res.status(201).json(populatedRequest);
  } catch (err) {
    console.error('Error creating team request:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/team-requests/:id/apply
router.post('/:id/apply', applyTeamLimiter, async (req, res) => {
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

    const hasApplied = teamRequest.applicants.some(a => a.userId.toString() === req.user._id.toString());
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

    res.status(200).json(updatedRequest);
  } catch (err) {
    console.error('Error applying to team request:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/team-requests/:id/close
router.post('/:id/close', async (req, res) => {
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

    res.status(200).json(updatedRequest);
  } catch (err) {
    console.error('Error closing team request:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
