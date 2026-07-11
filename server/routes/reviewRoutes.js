import express from 'express';
import Review from '../models/Review.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { applyAnonymity } from '../utils/anonymity.js';
import { postCreationLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// Middleware to ensure user is logged in
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }
  next();
};

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', requireAuth, postCreationLimiter, async (req, res, next) => {
  try {
    const { courseCode, professorName, semester, rating, comment, isAnonymous } = req.body;

    if (!courseCode || !professorName || !semester || !rating || !comment) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: { message: 'Rating must be a number between 1 and 5' } });
    }

    const review = await Review.findOneAndUpdate(
      { 
        authorId: req.user._id, 
        courseCode, 
        professorName 
      },
      {
        semester,
        rating: numericRating,
        comment,
        isAnonymous: Boolean(isAnonymous),
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );

    
    // Populate author before stripping
    await review.populate('authorId', 'name handle role');

    await logActivity({ action: 'create', resource: 'Review', description: 'Submitted a course review', req, details: { courseCode: review.courseCode, rating: review.rating } });

    res.status(201).json(applyAnonymity(review));
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/reviews
// @desc    Get reviews with optional filtering
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { courseCode, professorName, semester, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);
    
    let filter = { isHidden: false };
    if (courseCode) {
      const safeCourseCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.courseCode = new RegExp(safeCourseCode, 'i');
    }
    if (professorName) {
      const safeProf = professorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.professorName = new RegExp(safeProf, 'i');
    }
    if (semester) {
      const safeSemester = semester.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.semester = new RegExp(safeSemester, 'i');
    }

    // Run queries concurrently
    const [reviews, stats] = await Promise.all([
      Review.find(filter)
        .populate('authorId', 'name handle role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.aggregate([
        { $match: { ...filter, isHidden: false } },
        { 
          $group: { 
            _id: null, 
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ]);

    const safeReviews = reviews.map(r => applyAnonymity(r));
    
    const summary = stats.length > 0 
      ? { averageRating: Number(stats[0].averageRating.toFixed(1)), totalReviews: stats[0].totalReviews }
      : { averageRating: 0, totalReviews: 0 };

    res.json({ reviews: safeReviews, summary, page: parseInt(pageQuery, 10) || 1, limit });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/reviews/:id/report
// @desc    Report a review
// @access  Private
router.post('/:id/report', requireAuth, reportLimiter, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: { message: 'Review not found' } });
    }

    const alreadyReported = review.reports.find(r => r.userId.toString() === req.user._id.toString());
    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You have already reported this review' } });
    }

    review.reports.push({
      userId: req.user._id,
      reason: reason || 'Inappropriate content'
    });

    await review.save();

    await logActivity({ action: 'report', resource: 'Review', resourceId: review._id, description: 'Reported a review', req });

    res.json({ message: 'Review reported successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
