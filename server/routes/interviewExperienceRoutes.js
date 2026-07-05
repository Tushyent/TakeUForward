import express from 'express';
import InterviewExperience from '../models/InterviewExperience.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { applyAnonymity } from '../utils/anonymity.js';
import { getPaginationParams } from '../utils/paginationUtils.js';

const router = express.Router();

// GET /api/interview-experiences
router.get('/', async (req, res, next) => {
  try {
    const { company, role, year, page: pageQuery, limit: limitQuery } = req.query;
    const { page, limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    const query = { isHidden: { $ne: true } };
    
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
    console.error('Error fetching interview experiences:', err);
    next(err);
  }
});

// POST /api/interview-experiences
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { isAnonymous, company, role, batchYear, rounds, overallOutcome, tags } = req.body;

    if (!company || !role || !batchYear || !rounds || !overallOutcome) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const experience = await InterviewExperience.create({
      authorId: req.user._id,
      isAnonymous: Boolean(isAnonymous),
      company,
      role,
      batchYear,
      rounds,
      overallOutcome,
      tags: tags || []
    });

    res.status(201).json(applyAnonymity(experience));
  } catch (err) {
    console.error('Error creating interview experience:', err);
    next(err);
  }
});

// POST /api/interview-experiences/:id/upvote
router.post('/:id/upvote', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: 'Experience not found' });

    const userIdStr = req.user._id.toString();
    const hasUpvoted = experience.upvotes.some(id => id.toString() === userIdStr);

    const update = hasUpvoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } };

    const updatedExperience = await InterviewExperience.findByIdAndUpdate(req.params.id, update, { new: true });
    res.status(200).json({ upvoteCount: updatedExperience.upvotes.length });
  } catch (err) {
    console.error('Error toggling upvote:', err);
    next(err);
  }
});

// POST /api/interview-experiences/:id/report
router.post('/:id/report', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Report reason is required' });

    const experience = await InterviewExperience.findById(req.params.id);
    if (!experience) return res.status(404).json({ error: 'Experience not found' });

    const userIdStr = req.user._id.toString();
    const alreadyReported = experience.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this experience' });
    }

    experience.reports.push({
      userId: req.user._id,
      reason
    });

    if (experience.reports.length >= 3) {
      experience.isHidden = true;
    }

    await experience.save();
    res.status(200).json({ message: 'Experience reported successfully', isHidden: experience.isHidden });
  } catch (err) {
    console.error('Error reporting experience:', err);
    next(err);
  }
});

export default router;
