import express from 'express';
import ElectiveSuggestion from '../models/ElectiveSuggestion.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { postCreationLimiter, upvoteLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import { REPORT_THRESHOLD } from '../utils/constants.js';

const router = express.Router();

// GET /api/elective-suggestions
router.get('/', async (req, res, next) => {
  try {
    const { courseCode, platform, semester, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = { isHidden: { $ne: true } };
    
    if (courseCode) {
      const safeCourseCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.courseCode = { $regex: new RegExp(safeCourseCode, 'i') };
    }
    if (platform) query.platform = platform;
    if (semester) {
      const safeSemester = semester.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.semester = { $regex: new RegExp(safeSemester, 'i') };
    }

    const suggestions = await ElectiveSuggestion.aggregate([
      { $match: query },
      { $addFields: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { upvotesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    await ElectiveSuggestion.populate(suggestions, { 
      path: 'authorId', 
      select: 'name handle role dept isVerifiedAlumni username'
    });

    res.status(200).json(suggestions);
  } catch (err) {
    logger.error('Error fetching elective suggestions:', err);
    next(err);
  }
});

// POST /api/elective-suggestions
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { courseCode, courseName, platform, semester, recommendation, workloadRating, comment } = req.body;

    if (!courseCode || !courseName || !platform || !semester || !recommendation || !workloadRating || !comment) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    const validPlatforms = ['nptel', 'college_elective', 'other'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: { message: 'Invalid platform' } });
    }

    const validRecommendations = ['recommend', 'neutral', 'avoid'];
    if (!validRecommendations.includes(recommendation)) {
      return res.status(400).json({ error: { message: 'Invalid recommendation' } });
    }

    const numericWorkloadRating = Number(workloadRating);
    if (!Number.isInteger(numericWorkloadRating) || numericWorkloadRating < 1 || numericWorkloadRating > 5) {
      return res.status(400).json({ error: { message: 'Workload rating must be a number from 1 to 5' } });
    }

    const suggestion = await ElectiveSuggestion.create({
      authorId: req.user._id,
      courseCode,
      courseName,
      platform,
      semester,
      recommendation,
      workloadRating: numericWorkloadRating,
      comment
    });

    const populatedSuggestion = await ElectiveSuggestion.findById(suggestion._id)
      .populate('authorId', 'name handle role dept isVerifiedAlumni username');

    // Attach upvotesCount for frontend consistency with aggregation pipeline above
    const responseData = populatedSuggestion.toObject();
    responseData.upvotesCount = 0;

    res.status(201).json(responseData);
  } catch (err) {
    logger.error('Error creating elective suggestion:', err);
    next(err);
  }
});

// POST /api/elective-suggestions/:id/upvote
router.post('/:id/upvote', upvoteLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const suggestion = await ElectiveSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: { message: 'Suggestion not found' } });

    const userIdStr = req.user._id.toString();
    const hasUpvoted = suggestion.upvotes.some(id => id.toString() === userIdStr);

    const update = hasUpvoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } };

    const updatedSuggestion = await ElectiveSuggestion.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updatedSuggestion) return res.status(404).json({ error: { message: 'Suggestion not found' } });
    res.status(200).json({ upvotesCount: updatedSuggestion.upvotes.length });
  } catch (err) {
    logger.error('Error toggling upvote:', err);
    next(err);
  }
});

// POST /api/elective-suggestions/:id/report
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: { message: 'Report reason is required' } });

    const suggestion = await ElectiveSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: { message: 'Suggestion not found' } });

    const userIdStr = req.user._id.toString();
    const alreadyReported = suggestion.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You have already reported this suggestion' } });
    }

    suggestion.reports.push({
      userId: req.user._id,
      reason
    });

    if (suggestion.reports.length >= REPORT_THRESHOLD) {
      suggestion.isHidden = true;
    }

    await suggestion.save();
    res.status(200).json({ message: 'Suggestion reported successfully', isHidden: suggestion.isHidden });
  } catch (err) {
    logger.error('Error reporting suggestion:', err);
    next(err);
  }
});

export default router;
