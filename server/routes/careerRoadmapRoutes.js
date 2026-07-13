import express from 'express';
import CareerRoadmap from '../models/CareerRoadmap.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter, upvoteLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../services/activityLogger.js';
import { REPORT_THRESHOLD } from '../utils/constants.js';

const router = express.Router();

// GET /api/career-roadmaps
router.get('/', async (req, res, next) => {
  try {
    const { careerPath, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = { isHidden: { $ne: true } };
    if (careerPath) query.careerPath = careerPath;

    const roadmapsData = await CareerRoadmap.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name handle role currentCompany isVerifiedAlumni username')
      .lean();

    // Calculate upvotesCount locally instead of using $size in aggregate
    const roadmaps = roadmapsData.map(r => ({
      ...r,
      upvotesCount: r.upvotes ? r.upvotes.length : 0
    }));

    // Sort locally by upvotes
    roadmaps.sort((a, b) => b.upvotesCount - a.upvotesCount || new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(roadmaps);
  } catch (err) {
    logger.error('Error fetching career roadmaps:', err);
    next(err);
  }
});

// POST /api/career-roadmaps
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  // Same rule as Mock Interview mentor eligibility
  if (!req.user.isVerifiedAlumni || req.user.role !== 'alumni') {
    return res.status(403).json({ error: { message: 'Only verified alumni can create career roadmaps' } });
  }

  try {
    const { careerPath, title, steps } = req.body;

    if (!careerPath || !title || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: { message: 'Required fields missing or steps are empty' } });
    }

    // Ensure steps are properly formatted and ordered
    const formattedSteps = steps.map((step, index) => ({
      stepTitle: step.stepTitle,
      description: step.description,
      order: index + 1
    }));

    const roadmap = await CareerRoadmap.create({
      authorId: req.user._id,
      careerPath,
      title,
      steps: formattedSteps
    });

    const populatedRoadmap = await CareerRoadmap.findById(roadmap._id)
      .populate('authorId', 'name handle role currentCompany isVerifiedAlumni username');

    const responseData = populatedRoadmap.toObject();
    responseData.upvotesCount = 0;

    await logActivity({ action: 'create', resource: 'CareerRoadmap', resourceId: roadmap._id, description: 'Created a career roadmap', req, details: { title: roadmap.title, targetRole: roadmap.targetRole } });

    res.status(201).json(responseData);
  } catch (err) {
    logger.error('Error creating career roadmap:', err);
    next(err);
  }
});

// POST /api/career-roadmaps/:id/upvote
router.post('/:id/upvote', upvoteLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const roadmap = await CareerRoadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ error: { message: 'Career roadmap not found' } });

    const userIdStr = req.user._id.toString();
    const hasUpvoted = roadmap.upvotes.some(id => id.toString() === userIdStr);

    const update = hasUpvoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } };

    const updatedRoadmap = await CareerRoadmap.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updatedRoadmap) return res.status(404).json({ error: { message: 'Career roadmap not found' } });

    await logActivity({ action: 'upvote', resource: 'CareerRoadmap', resourceId: req.params.id, description: 'Upvoted a career roadmap', req });

    res.status(200).json({ upvotesCount: updatedRoadmap.upvotes.length });
  } catch (err) {
    logger.error('Error toggling upvote:', err);
    next(err);
  }
});

// POST /api/career-roadmaps/:id/report
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: { message: 'Report reason is required' } });

    const roadmap = await CareerRoadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ error: { message: 'Career roadmap not found' } });

    const userIdStr = req.user._id.toString();
    const alreadyReported = roadmap.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You have already reported this roadmap' } });
    }

    roadmap.reports.push({
      userId: req.user._id,
      reason
    });

    if (roadmap.reports.length >= REPORT_THRESHOLD) {
      roadmap.isHidden = true;
    }

    await roadmap.save();

    await logActivity({ action: 'report', resource: 'CareerRoadmap', resourceId: roadmap._id, description: 'Reported a career roadmap', req });

    res.status(200).json({ message: 'Roadmap reported successfully', isHidden: roadmap.isHidden });
  } catch (err) {
    logger.error('Error reporting roadmap:', err);
    next(err);
  }
});

export default router;
