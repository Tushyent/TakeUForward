import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Resource from '../models/Resource.js';
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

    res.json({
      message: 'User and associated content deleted',
      deletedResources,
      deletedPrivateFiles
    });
  } catch (err) {
    next(err);
  }
});

export default router;
