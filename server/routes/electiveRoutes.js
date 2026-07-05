import express from 'express';
import ElectiveSuggestion from '../models/ElectiveSuggestion.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/elective-suggestions
router.get('/', async (req, res) => {
  try {
    const { courseCode, platform, semester, page = 1, limit = 10 } = req.query;
    
    const query = { isHidden: { $ne: true } };
    
    if (courseCode) query.courseCode = { $regex: new RegExp(courseCode, 'i') };
    if (platform) query.platform = platform;
    if (semester) query.semester = { $regex: new RegExp(semester, 'i') };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const suggestions = await ElectiveSuggestion.aggregate([
      { $match: query },
      { $addFields: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { upvotesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit, 10) }
    ]);

    await ElectiveSuggestion.populate(suggestions, { 
      path: 'authorId', 
      select: 'name handle role dept isVerifiedAlumni username'
    });

    res.status(200).json(suggestions);
  } catch (err) {
    console.error('Error fetching elective suggestions:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/elective-suggestions
router.post('/', postCreationLimiter, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { courseCode, courseName, platform, semester, recommendation, workloadRating, comment } = req.body;

    if (!courseCode || !courseName || !platform || !semester || !recommendation || !workloadRating || !comment) {
      return res.status(400).json({ error: { message: 'Required fields missing' } });
    }

    const suggestion = await ElectiveSuggestion.create({
      authorId: req.user._id,
      courseCode,
      courseName,
      platform,
      semester,
      recommendation,
      workloadRating: Number(workloadRating),
      comment
    });

    const populatedSuggestion = await ElectiveSuggestion.findById(suggestion._id)
      .populate('authorId', 'name handle role dept isVerifiedAlumni username');

    // Attach upvotesCount for frontend consistency with aggregation pipeline above
    const responseData = populatedSuggestion.toObject();
    responseData.upvotesCount = 0;

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Error creating elective suggestion:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/elective-suggestions/:id/upvote
router.post('/:id/upvote', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const suggestion = await ElectiveSuggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ error: { message: 'Suggestion not found' } });

    const userIdStr = req.user._id.toString();
    const upvoteIndex = suggestion.upvotes.findIndex(id => id.toString() === userIdStr);

    if (upvoteIndex === -1) {
      suggestion.upvotes.push(req.user._id);
    } else {
      suggestion.upvotes.splice(upvoteIndex, 1);
    }

    await suggestion.save();
    res.status(200).json({ upvotesCount: suggestion.upvotes.length });
  } catch (err) {
    console.error('Error toggling upvote:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/elective-suggestions/:id/report
router.post('/:id/report', async (req, res) => {
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

    if (suggestion.reports.length >= 3) {
      suggestion.isHidden = true;
    }

    await suggestion.save();
    res.status(200).json({ message: 'Suggestion reported successfully', isHidden: suggestion.isHidden });
  } catch (err) {
    console.error('Error reporting suggestion:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
