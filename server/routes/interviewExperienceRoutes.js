import express from 'express';
import InterviewExperience from '../models/InterviewExperience.js';
import Bookmark from '../models/Bookmark.js';
import { postCreationLimiter, upvoteLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { applyAnonymity } from '../utils/anonymity.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../services/activityLogger.js';
import { REPORT_THRESHOLD } from '../utils/constants.js';

const router = express.Router();

// GET /api/interview-experiences
router.get('/', async (req, res, next) => {
  try {
    const { company, role, year, authorId, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    const query = { isHidden: { $ne: true } };
    
    if (authorId) query.authorId = authorId;
    if (company) {
      const safeCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.company = { $regex: new RegExp(safeCompany, 'i') };
    }
    if (role) {
      const safeRole = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.role = { $regex: new RegExp(safeRole, 'i') };
    }
    if (year) query.batchYear = parseInt(year, 10);

    const experiences = await InterviewExperience.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name dept role handle isVerifiedAlumni username');

    const safeExperiences = experiences.map(applyAnonymity);

    res.status(200).json(safeExperiences);
  } catch (err) {
    logger.error('Error fetching interview experiences:', err);
    next(err);
  }
});

// POST /api/interview-experiences
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { isAnonymous, company, role, batchYear, rounds, overallOutcome, tags } = req.body;

    if (!company || !role || !batchYear || !rounds || !overallOutcome) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    const validOutcomes = ['selected', 'rejected', 'withdrawn'];
    if (!validOutcomes.includes(overallOutcome)) {
      return res.status(400).json({ error: { message: 'Invalid overall outcome' } });
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return res.status(400).json({ error: { message: 'At least one interview round is required' } });
    }

    const formattedRounds = [];
    for (const round of rounds) {
      const difficulty = Number(round?.difficulty);
      if (!round?.roundName || !round?.description || !Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
        return res.status(400).json({ error: { message: 'Each round requires a name, description, and difficulty from 1 to 5' } });
      }

      formattedRounds.push({
        roundName: round.roundName,
        description: round.description,
        difficulty,
      });
    }

    const experience = await InterviewExperience.create({
      authorId: req.user._id,
      isAnonymous: Boolean(isAnonymous),
      company,
      role,
      batchYear,
      rounds: formattedRounds,
      overallOutcome,
      tags: tags || []
    });

    await logActivity({ action: 'create', resource: 'InterviewExperience', resourceId: experience._id, description: 'Shared an interview experience', req, details: { company: experience.company, role: experience.role } });

    res.status(201).json(applyAnonymity(experience));
  } catch (err) {
    logger.error('Error creating interview experience:', err);
    next(err);
  }
});

// POST /api/interview-experiences/:id/upvote
router.post('/:id/upvote', upvoteLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: { message: 'Experience not found' } });

    const userIdStr = req.user._id.toString();
    const hasUpvoted = experience.upvotes.some(id => id.toString() === userIdStr);

    const update = hasUpvoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } };

    const updatedExperience = await InterviewExperience.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updatedExperience) return res.status(404).json({ error: { message: 'Experience not found' } });

    await logActivity({ action: 'upvote', resource: 'InterviewExperience', resourceId: req.params.id, description: 'Upvoted an interview experience', req });

    res.status(200).json({ upvoteCount: updatedExperience.upvotes.length });
  } catch (err) {
    logger.error('Error toggling upvote:', err);
    next(err);
  }
});

// POST /api/interview-experiences/:id/report
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: { message: 'Report reason is required' } });

    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: { message: 'Experience not found' } });

    const userIdStr = req.user._id.toString();
    const alreadyReported = experience.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You have already reported this experience' } });
    }

    experience.reports.push({
      userId: req.user._id,
      reason
    });

    if (experience.reports.length >= REPORT_THRESHOLD) {
      experience.isHidden = true;
    }

    await experience.save();

    await logActivity({ action: 'report', resource: 'InterviewExperience', resourceId: experience._id, description: 'Reported an interview experience', req });

    res.status(200).json({ message: 'Experience reported successfully', isHidden: experience.isHidden });
  } catch (err) {
    logger.error('Error reporting experience:', err);
    next(err);
  }
});

// DELETE /api/interview-experiences/:id
router.delete('/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: { message: 'Experience not found' } });

    if (!req.user.isPlatformAdmin && experience.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this experience' } });
    }

    await InterviewExperience.findByIdAndDelete(req.params.id);
    await Bookmark.deleteMany({ itemType: 'interview_experience', itemId: req.params.id });

    const actionDesc = req.user.isPlatformAdmin && experience.authorId.toString() !== req.user._id.toString() 
      ? 'Admin deleted an interview experience' 
      : 'User deleted their own interview experience';
    await logActivity({ action: 'delete', resource: 'InterviewExperience', resourceId: req.params.id, description: actionDesc, req });

    res.status(200).json({ message: 'Experience deleted successfully' });
  } catch (err) {
    logger.error('Error deleting experience:', err);
    next(err);
  }
});

export default router;
