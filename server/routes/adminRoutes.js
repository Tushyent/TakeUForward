import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Resource from '../models/Resource.js';
import Club from '../models/Club.js';
import Community from '../models/Community.js';
import Bookmark from '../models/Bookmark.js';
import Chat from '../models/Chat.js';
import PrivateFile from '../models/PrivateFile.js';
import SupportTicket from '../models/SupportTicket.js';
import Review from '../models/Review.js';
import ReferralRequest from '../models/ReferralRequest.js';
import MockInterviewRequest from '../models/MockInterviewRequest.js';
import TeamRequest from '../models/TeamRequest.js';
import LostFoundItem from '../models/LostFoundItem.js';
import MarketplaceItem from '../models/MarketplaceItem.js';
import InterviewExperience from '../models/InterviewExperience.js';
import ElectiveSuggestion from '../models/ElectiveSuggestion.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import Notification from '../models/Notification.js';
import { requireSystemAdmin } from '../middleware/requireSystemAdmin.js';
import { deleteObjectByKey, deletePublicObjectByUrl } from '../config/s3.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { isSystemAdminUser } from '../utils/userIdentity.js';
import { logActivity } from '../services/activityLogger.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendEmail, verifyTransporter } from '../config/mailer.js';

const router = express.Router();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const validateObjectId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: { message: 'Invalid id' } });
    return false;
  }
  return true;
};

const deleteResources = async (query) => {
  const resources = await Resource.find(query).select('_id fileUrl').lean();
  for (const resource of resources) {
    await deletePublicObjectByUrl(resource.fileUrl);
  }
  const ids = resources.map(resource => resource._id);
  if (ids.length > 0) {
    await Resource.deleteMany({ _id: { $in: ids } });
    await Bookmark.deleteMany({ itemType: 'resource', itemId: { $in: ids } });
  }
  return ids.length;
};

const deletePrivateFiles = async (query) => {
  const files = await PrivateFile.find(query).select('_id s3Key').lean();
  for (const file of files) {
    await deleteObjectByKey(file.s3Key);
  }
  const ids = files.map(file => file._id);
  if (ids.length > 0) {
    await PrivateFile.deleteMany({ _id: { $in: ids } });
  }
  return ids.length;
};

router.get('/overview', requireSystemAdmin, async (req, res, next) => {
  try {
    const [
      users,
      posts,
      resources,
      reports,
      supportTickets,
      pendingAlumniRequests
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Resource.countDocuments(),
      Post.countDocuments({ 'reports.0': { $exists: true } }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      (await import('../models/AlumniRegistrationRequest.js')).default.countDocuments({ status: 'pending' })
    ]);

    res.json({ users, posts, resources, reports, supportTickets, pendingAlumniRequests });
  } catch (err) {
    next(err);
  }
});

router.get('/signups', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const [users, totalCount] = await Promise.all([
      User.find()
        .select('name email username handle dept year role createdAt isPlatformAdmin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);
    res.json({ signups: users, totalCount, hasMore: skip + users.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.get('/users', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { q } = req.query;
    const query = {};

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      query.$or = [{ name: regex }, { email: regex }, { username: regex }, { handle: regex }];
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('name email username handle role dept year currentCompany isVerifiedAlumni isPlatformAdmin createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({ users, totalCount, hasMore: skip + users.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.get('/resources', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { q, courseCode } = req.query;
    const query = {};

    if (courseCode) query.courseCode = new RegExp(escapeRegex(courseCode), 'i');
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      query.$or = [{ title: regex }, { courseCode: regex }, { tags: regex }];
    }

    const [resources, totalCount] = await Promise.all([
      Resource.find(query)
        .populate('uploaderId', 'name email username handle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(query)
    ]);

    res.json({ resources, totalCount, hasMore: skip + resources.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.delete('/resources/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;

  try {
    const deletedCount = await deleteResources({ _id: req.params.id });
    if (deletedCount === 0) {
      return res.status(404).json({ error: { message: 'Resource not found' } });
    }
    await logActivity({ action: 'delete', resource: 'Resource', resourceId: req.params.id, description: 'Admin deleted a resource', req });
    res.json({ message: 'Resource file and metadata deleted' });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    if (isSystemAdminUser(user)) {
      return res.status(400).json({ error: { message: 'The system admin account cannot be deleted' } });
    }

    const userId = user._id;
    const deletedResources = await deleteResources({ uploaderId: userId });
    const deletedPrivateFiles = await deletePrivateFiles({ ownerId: userId });

    await Promise.all([
      Post.deleteMany({ authorId: userId }),
      Post.updateMany({}, {
        $pull: {
          comments: { authorId: userId },
          reports: { userId },
          upvotes: userId,
          mentions: userId
        }
      }),
      Review.deleteMany({ authorId: userId }),
      Review.updateMany({}, { $pull: { reports: { userId } } }),
      InterviewExperience.deleteMany({ authorId: userId }),
      InterviewExperience.updateMany({}, { $pull: { reports: { userId }, upvotes: userId } }),
      ElectiveSuggestion.deleteMany({ authorId: userId }),
      ElectiveSuggestion.updateMany({}, { $pull: { reports: { userId }, upvotes: userId } }),
      CareerRoadmap.deleteMany({ authorId: userId }),
      CareerRoadmap.updateMany({}, { $pull: { reports: { userId }, upvotes: userId } }),
      ReferralRequest.deleteMany({ $or: [{ requesterId: userId }, { matchedAlumniId: userId }] }),
      MockInterviewRequest.deleteMany({ $or: [{ requesterId: userId }, { matchedMentorId: userId }] }),
      TeamRequest.deleteMany({ authorId: userId }),
      TeamRequest.updateMany({}, { $pull: { applicants: { userId } } }),
      LostFoundItem.deleteMany({ authorId: userId }),
      MarketplaceItem.deleteMany({ sellerId: userId }),
      MarketplaceItem.updateMany({}, { $pull: { reports: { reporterId: userId } } }),
      Bookmark.deleteMany({ userId }),
      Chat.deleteMany({ participants: userId }),
      SupportTicket.deleteMany({ authorId: userId }),
      Notification.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    await logActivity({ action: 'delete', resource: 'User', resourceId: req.params.id, description: `Admin deleted user ${user.email || user._id}`, req });
    res.json({
      message: 'User and associated content deleted',
      deletedResources,
      deletedPrivateFiles
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/approve', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
      .select('name email role dept isApproved');
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });
    await logActivity({ action: 'approve', resource: 'User', resourceId: req.params.id, description: 'Admin approved user', req, details: { userName: user.name, userEmail: user.email } });
    res.json({ message: 'User approved', user });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Club CRUD
// ──────────────────────────────────────────────

router.get('/clubs', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { q } = req.query;
    const query = {};
    if (q) {
      query.name = new RegExp(escapeRegex(q), 'i');
    }
    const [clubs, totalCount] = await Promise.all([
      Club.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Club.countDocuments(query)
    ]);
    res.json({ clubs, totalCount, hasMore: skip + clubs.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.post('/clubs', requireSystemAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: { message: 'Name and description are required' } });
    }
    const existing = await Club.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: { message: 'A club with that name already exists' } });
    }
    const club = await Club.create({ name, description });
    await logActivity({ action: 'create', resource: 'Club', resourceId: club._id, description: `Admin created club "${name}"`, req });
    res.status(201).json(club);
  } catch (err) {
    next(err);
  }
});

router.put('/clubs/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const { name, description } = req.body;
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: { message: 'Club not found' } });
    if (name) club.name = name;
    if (description) club.description = description;
    await club.save();
    await logActivity({ action: 'update', resource: 'Club', resourceId: req.params.id, description: `Admin updated club "${club.name}"`, req });
    res.json(club);
  } catch (err) {
    next(err);
  }
});

router.delete('/clubs/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ error: { message: 'Club not found' } });
    await Post.updateMany({ clubId: req.params.id }, { clubId: null });
    await logActivity({ action: 'delete', resource: 'Club', resourceId: req.params.id, description: 'Admin deleted a club', req });
    res.json({ message: 'Club deleted' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Community CRUD
// ──────────────────────────────────────────────

router.get('/communities', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit, 100);
    const { q } = req.query;
    const query = {};
    if (q) {
      query.name = new RegExp(escapeRegex(q), 'i');
    }
    const [communities, totalCount] = await Promise.all([
      Community.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Community.countDocuments(query)
    ]);
    res.json({ communities, totalCount, hasMore: skip + communities.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.post('/communities', requireSystemAdmin, async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: { message: 'Name and type are required' } });
    }
    const validTypes = ['dept', 'batch', 'general', 'topic'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { message: `Type must be one of: ${validTypes.join(', ')}` } });
    }
    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: { message: 'A community with that name already exists' } });
    }
    const community = await Community.create({ name, type, description: description || '' });
    await logActivity({ action: 'create', resource: 'Community', resourceId: community._id, description: `Admin created community "${name}"`, req });
    res.status(201).json(community);
  } catch (err) {
    next(err);
  }
});

router.put('/communities/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const { name, description } = req.body;
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: { message: 'Community not found' } });
    if (name) community.name = name;
    if (description !== undefined) community.description = description;
    await community.save();
    await logActivity({ action: 'update', resource: 'Community', resourceId: req.params.id, description: `Admin updated community "${community.name}"`, req });
    res.json(community);
  } catch (err) {
    next(err);
  }
});

router.delete('/communities/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const community = await Community.findByIdAndDelete(req.params.id);
    if (!community) return res.status(404).json({ error: { message: 'Community not found' } });
    await Post.updateMany({ communityId: req.params.id }, { $set: { communityId: null } });
    await logActivity({ action: 'delete', resource: 'Community', resourceId: req.params.id, description: 'Admin deleted a community', req });
    res.json({ message: 'Community deleted' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Posts — list and delete for admin
// ──────────────────────────────────────────────

router.get('/posts', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { q } = req.query;
    const query = {};
    if (q) {
      query.content = new RegExp(escapeRegex(q), 'i');
    }
    const [posts, totalCount] = await Promise.all([
      Post.find(query)
        .populate('authorId', 'name email username handle')
        .populate('communityId', 'name')
        .populate('clubId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query)
    ]);
    res.json({ posts, totalCount, hasMore: skip + posts.length < totalCount });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:id', requireSystemAdmin, async (req, res, next) => {
  if (!validateObjectId(req.params.id, res)) return;
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });
    await Bookmark.deleteMany({ itemType: 'post', itemId: req.params.id });
    await logActivity({ action: 'delete', resource: 'Post', resourceId: req.params.id, description: 'Admin deleted a post', req });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Activity Log
// ──────────────────────────────────────────────

router.get('/activity', requireSystemAdmin, async (req, res, next) => {
  try {
    const { limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    const { q } = req.query;

    const query = {};
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      query.$or = [
        { description: regex },
        { userName: regex },
        { resource: regex },
        { action: regex },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({ logs, totalCount, hasMore: skip + logs.length < totalCount });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Email Status — check if Resend is connected
// ──────────────────────────────────────────────

router.get('/email-status', requireSystemAdmin, async (req, res, next) => {
  try {
    const status = await verifyTransporter();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Email Test — send a test email to yourself
// ──────────────────────────────────────────────

router.post('/test-email', requireSystemAdmin, async (req, res, next) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: { message: 'Recipient email (to) is required' } });
  try {
    await sendEmail({
      to,
      subject: 'TakeUForward Resend Test',
      html: `<p>This is a test email from TakeUForward via Resend. If you received this, email is working correctly.</p>`
    });
    res.json({ message: `Test email sent to ${to}. Check inbox and spam folder.` });
  } catch (err) {
    next(err);
  }
});

export default router;
