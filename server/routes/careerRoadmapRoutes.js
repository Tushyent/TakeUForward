import express from 'express';
import CareerRoadmap from '../models/CareerRoadmap.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/career-roadmaps
router.get('/', async (req, res) => {
  try {
    const { careerPath, page = 1, limit = 10 } = req.query;
    
    const query = { isHidden: { $ne: true } };
    if (careerPath) query.careerPath = careerPath;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const roadmaps = await CareerRoadmap.aggregate([
      { $match: query },
      { $addFields: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { upvotesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit, 10) }
    ]);

    await CareerRoadmap.populate(roadmaps, { 
      path: 'authorId', 
      select: 'name handle role currentCompany isVerifiedAlumni username'
    });

    res.status(200).json(roadmaps);
  } catch (err) {
    console.error('Error fetching career roadmaps:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/career-roadmaps
router.post('/', postCreationLimiter, async (req, res) => {
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

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Error creating career roadmap:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/career-roadmaps/:id/upvote
router.post('/:id/upvote', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const roadmap = await CareerRoadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ error: { message: 'Career roadmap not found' } });

    const userIdStr = req.user._id.toString();
    const upvoteIndex = roadmap.upvotes.findIndex(id => id.toString() === userIdStr);

    if (upvoteIndex === -1) {
      roadmap.upvotes.push(req.user._id);
    } else {
      roadmap.upvotes.splice(upvoteIndex, 1);
    }

    await roadmap.save();
    res.status(200).json({ upvotesCount: roadmap.upvotes.length });
  } catch (err) {
    console.error('Error toggling upvote:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// POST /api/career-roadmaps/:id/report
router.post('/:id/report', async (req, res) => {
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

    if (roadmap.reports.length >= 3) {
      roadmap.isHidden = true;
    }

    await roadmap.save();
    res.status(200).json({ message: 'Roadmap reported successfully', isHidden: roadmap.isHidden });
  } catch (err) {
    console.error('Error reporting roadmap:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export default router;
