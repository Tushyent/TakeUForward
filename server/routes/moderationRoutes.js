import express from 'express';
import Post from '../models/Post.js';
import Review from '../models/Review.js';
import InterviewExperience from '../models/InterviewExperience.js';
import ElectiveSuggestion from '../models/ElectiveSuggestion.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import crypto from 'crypto';
import { applyAnonymity } from '../utils/anonymity.js';
import { sendEmail, buildEmailFooter } from '../config/mailer.js';
import { requireSystemAdmin } from '../middleware/requireSystemAdmin.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

// @route   GET /api/moderation/queue
// @desc    Get all reported/hidden posts and reviews
// @access  Private (Platform Admin)
router.get('/queue', requireSystemAdmin, async (req, res, next) => {
  try {
    const flaggedPosts = await Post.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ createdAt: -1 });

    const flaggedReviews = await Review.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ createdAt: -1 });

    const flaggedExperiences = await InterviewExperience.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ createdAt: -1 });

    const flaggedElectives = await ElectiveSuggestion.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ createdAt: -1 });

    const flaggedRoadmaps = await CareerRoadmap.find({
      $or: [
        { isHidden: true },
        { 'reports.0': { $exists: true } }
      ]
    })
      .populate('authorId', 'name handle role')
      .populate('reports.userId', 'name handle')
      .sort({ createdAt: -1 });

    const safePosts = flaggedPosts.map(post => ({ type: 'post', ...applyAnonymity(post) }));
    const safeReviews = flaggedReviews.map(review => ({ type: 'review', ...applyAnonymity(review) }));
    const safeExperiences = flaggedExperiences.map(exp => ({ type: 'interview_experience', ...applyAnonymity(exp) }));
    const typedElectives = flaggedElectives.map(e => ({ type: 'elective_suggestion', ...e.toObject() }));
    const typedRoadmaps = flaggedRoadmaps.map(r => ({ type: 'career_roadmap', ...r.toObject() }));

    const combined = [...safePosts, ...safeReviews, ...safeExperiences, ...typedElectives, ...typedRoadmaps].sort((a, b) => b.reports.length - a.reports.length || new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/moderation/:itemId/resolve
// @desc    Resolve a reported post or review (dismiss or remove)
// @access  Private (Platform Admin)
router.post('/:itemId/resolve', requireSystemAdmin, async (req, res, next) => {
  try {
    const { action, type = 'post' } = req.body;
    
    if (action !== 'dismiss' && action !== 'remove') {
      return res.status(400).json({ error: { message: 'Invalid action. Must be dismiss or remove.' } });
    }

    let Model = Post;
    if (type === 'review') Model = Review;
    if (type === 'interview_experience') Model = InterviewExperience;
    if (type === 'elective_suggestion') Model = ElectiveSuggestion;
    if (type === 'career_roadmap') Model = CareerRoadmap;
    const item = await Model.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: { message: 'Item not found' } });
    }

    if (action === 'dismiss') {
      item.reports = [];
      item.isHidden = false;
      await item.save();
      await logActivity({ action: 'update', resource: Model.modelName, resourceId: req.params.itemId, description: 'Moderated a reported item', req });
      return res.json({ message: 'Item dismissed successfully', item });
    } 
    
    if (action === 'remove') {
      await Model.findByIdAndDelete(req.params.itemId);
      await logActivity({ action: 'update', resource: Model.modelName, resourceId: req.params.itemId, description: 'Moderated a reported item', req });
      return res.json({ message: 'Item removed successfully' });
    }

  } catch (err) {
    next(err);
  }
});

// @route   GET /api/moderation/alumni-requests
// @desc    Get all pending alumni registration requests
// @access  Private (Platform Admin)
router.get('/alumni-requests', requireSystemAdmin, async (req, res, next) => {
  try {
    const { getPaginationParams } = await import('../utils/paginationUtils.js');
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);

    const AlumniRegistrationRequest = (await import('../models/AlumniRegistrationRequest.js')).default;
    const requests = await AlumniRegistrationRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/moderation/alumni-requests/:id/approve
// @desc    Approve an alumni request and send invite
// @access  Private (Platform Admin)
router.post('/alumni-requests/:id/approve', requireSystemAdmin, async (req, res, next) => {
  try {
    const AlumniRegistrationRequest = (await import('../models/AlumniRegistrationRequest.js')).default;
    const ApprovedAlumniEmail = (await import('../models/ApprovedAlumniEmail.js')).default;

    const request = await AlumniRegistrationRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: { message: 'Pending request not found' } });
    }

    // 1. Mark request as approved
    request.status = 'approved';
    await request.save();

    // 2. Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Add to approved emails
    await ApprovedAlumniEmail.findOneAndUpdate(
      { email: request.email },
      { 
        email: request.email, 
        inviteToken, 
        status: 'verified',
        currentCompany: request.currentCompany 
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 4. Send email
    const loginLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    await sendEmail({
      to: request.email,
      subject: 'Your Alumni Request is Approved',
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#7C6AF7;font-size:22px;">Alumni Status Approved!</h1>
        <p>Hi ${request.name || 'there'},</p>
        <p>Your alumni registration request has been <strong style="color:#28a745;">approved</strong>! You now have full access to the TakeUForward platform.</p>
        <p>You can now connect with juniors, share interview experiences, post referrals, and help shape the next generation of SSN engineers.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginLink}" style="display:inline-block;background:#7C6AF7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Log in to TakeUForward</a>
        </div>
        ${buildEmailFooter()}
      </div>`
    });

    await logActivity({ action: 'approve', resource: 'AlumniRegistrationRequest', resourceId: req.params.id, description: 'Approved alumni verification request', req });
    res.json({ message: 'Request approved and invite sent' });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/moderation/alumni-requests/:id/reject
// @desc    Reject an alumni request
// @access  Private (Platform Admin)
router.post('/alumni-requests/:id/reject', requireSystemAdmin, async (req, res, next) => {
  try {
    const AlumniRegistrationRequest = (await import('../models/AlumniRegistrationRequest.js')).default;
    const request = await AlumniRegistrationRequest.findById(req.params.id);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({ error: { message: 'Pending request not found' } });
    }

    request.status = 'rejected';
    await request.save();

    await logActivity({ action: 'update', resource: 'AlumniRegistrationRequest', resourceId: req.params.id, description: 'Rejected alumni verification request', req });
    res.json({ message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
});

export default router;
