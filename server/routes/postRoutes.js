import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import '../models/Club.js'; // Required for mongoose populate
import { createNotification } from '../services/notificationService.js';
import { postCreationLimiter, upvoteLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { applyAnonymity } from '../utils/anonymity.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/posts
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  try {
    const { communityId, isAnonymous, content, tags } = req.body;
    
    if (!communityId || !content || !content.trim()) {
      return res.status(400).json({ error: { message: 'communityId and content are required' } });
    }

    const communityExists = await Community.findById(communityId);
    if (!communityExists) {
      return res.status(400).json({ error: { message: 'Invalid communityId' } });
    }

    // Basic tags validation
    let validTags = {};
    if (tags && typeof tags === 'object') {
      if (tags.dept) validTags.dept = String(tags.dept).trim();
      if (tags.year) validTags.year = Number(tags.year) || undefined;
      if (tags.courseCode) validTags.courseCode = String(tags.courseCode).trim().toUpperCase();
    }

    const post = await Post.create({
      authorId: req.user._id,
      communityId,
      isAnonymous: Boolean(isAnonymous),
      content,
      tags: validTags
    });

    // Parse @mentions
    const mentionRegex = /@([\w.-]+)/g;
    const matches = [...content.matchAll(mentionRegex)].map(m => m[1]);
    if (matches.length > 0) {
      const mentionedUsers = await User.find({ handle: { $in: matches } });
      const mentionedIds = mentionedUsers.map(u => u._id);

      if (mentionedIds.length > 0) {
        post.mentions = mentionedIds;
        await post.save();

        // Create notifications for mentioned users
        for (const userId of mentionedIds) {
          if (userId.toString() !== req.user._id.toString()) {
            await createNotification({
              userId,
              type: 'mention',
              refId: post._id,
              isAnonymousSender: Boolean(isAnonymous),
              content
            });
          }
        }
      }
    }

    res.status(201).json(applyAnonymity(post));
  } catch (err) {
    logger.error('Error creating post:', err);
    next(err);
  }
});

// GET /api/posts
router.get('/', async (req, res, next) => {
  try {
    const { communityId, type, dept, year, courseCode, q, page: pageQuery, limit: limitQuery } = req.query;
    
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = { isHidden: { $ne: true } };
    
    if (communityId) query.communityId = communityId;
    if (type) query.type = type;
    if (dept) query['tags.dept'] = dept;
    if (year) query['tags.year'] = year;
    if (courseCode) query['tags.courseCode'] = courseCode;
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.content = { $regex: new RegExp(safeQ, 'i') };
    }

    const { sort } = req.query;

    let posts;
    if (sort === 'hot') {
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
            commentCount: { $size: { $ifNull: ["$comments", []] } },
            ageHours: {
              $max: [
                1,
                { $divide: [ { $subtract: [ new Date(), "$createdAt" ] }, 3600000 ] }
              ]
            }
          }
        },
        {
          $addFields: {
            hotScore: { $divide: [ { $add: ["$upvoteCount", "$commentCount"] }, "$ageHours" ] }
          }
        },
        { $sort: { hotScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];
      
      const aggregateResult = await Post.aggregate(pipeline);
      posts = await Post.populate(aggregateResult, [
        { path: 'authorId', select: 'name dept role handle isVerifiedAlumni username' },
        { path: 'comments.authorId', select: 'name dept role handle isVerifiedAlumni username' },
        { path: 'clubId', select: 'name' }
      ]);
    } else {
      posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name dept role handle isVerifiedAlumni username')
        .populate('comments.authorId', 'name dept role handle isVerifiedAlumni username')
        .populate('clubId', 'name'); // Populate club details for announcements
    }

    const safePosts = posts.map(applyAnonymity);

    res.status(200).json(safePosts);
  } catch (err) {
    logger.error('Error fetching posts:', err);
    next(err);
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'name dept role handle isVerifiedAlumni username')
      .populate('comments.authorId', 'name dept role handle isVerifiedAlumni username')
      .populate('clubId', 'name');
    
    if (!post) {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }

    res.status(200).json(applyAnonymity(post));
  } catch (err) {
    logger.error('Error fetching post:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Post not found' } });
    }
    next(err);
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { text, isAnonymous } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: { message: 'Comment text is required' } });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });

    const newComment = {
      authorId: req.user._id,
      isAnonymous: Boolean(isAnonymous),
      text
    };

    post.comments.push(newComment);
    
    // Parse @mentions in comment
    const mentionRegex = /@([\w.-]+)/g;
    const matches = [...text.matchAll(mentionRegex)].map(m => m[1]);
    let mentionedIds = [];
    if (matches.length > 0) {
      const mentionedUsers = await User.find({ handle: { $in: matches } });
      mentionedIds = mentionedUsers.map(u => u._id);

      // We just append new mentions to the post's mentions array, keeping unique
      if (mentionedIds.length > 0) {
        const existingMentions = post.mentions.map(id => id.toString());
        for (const id of mentionedIds) {
          if (!existingMentions.includes(id.toString())) {
            post.mentions.push(id);
          }
        }
      }
    }

    await post.save();

    // Create notifications for mentioned users in comment
    for (const userId of mentionedIds) {
      if (userId.toString() !== req.user._id.toString()) {
        await createNotification({
          userId,
          type: 'mention',
          refId: post._id,
          isAnonymousSender: Boolean(isAnonymous),
          content: text
        });
      }
    }

    // Notify post author of the new comment
    if (post.authorId.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: post.authorId,
        type: 'comment', // Treat this as a reply to the post
        refId: post._id,
        isAnonymousSender: Boolean(isAnonymous),
        content: text
      });
    }

    // Populate the newly added comment author for the response
    await post.populate('comments.authorId', 'name dept role handle isVerifiedAlumni username');
    
    // Find the newly added comment to apply anonymity just to it, or return the whole post
    res.status(201).json(applyAnonymity(post));
  } catch (err) {
    logger.error('Error adding comment:', err);
    next(err);
  }
});

// POST /api/posts/:id/upvote
router.post('/:id/upvote', upvoteLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });

    const userIdStr = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userIdStr);

    const update = hasUpvoted
      ? { $pull: { upvotes: req.user._id } }
      : { $addToSet: { upvotes: req.user._id } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updatedPost) return res.status(404).json({ error: { message: 'Post not found' } });
    res.status(200).json({ upvoteCount: updatedPost.upvotes.length });
  } catch (err) {
    logger.error('Error toggling upvote:', err);
    next(err);
  }
});

// POST /api/posts/:id/report
router.post('/:id/report', reportLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: { message: 'Report reason is required' } });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });

    const userIdStr = req.user._id.toString();
    const alreadyReported = post.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: { message: 'You have already reported this post' } });
    }

    post.reports.push({
      userId: req.user._id,
      reason
    });

    if (post.reports.length >= 3) {
      post.isHidden = true;
    }

    await post.save();
    res.status(200).json({ message: 'Post reported successfully', isHidden: post.isHidden });
  } catch (err) {
    logger.error('Error reporting post:', err);
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });

    if (post.authorId.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this post' } });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    logger.error('Error deleting post:', err);
    next(err);
  }
});

// DELETE /api/posts/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: { message: 'Post not found' } });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: { message: 'Comment not found' } });

    if (comment.authorId.toString() !== req.user._id.toString() && !req.user.isPlatformAdmin) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this comment' } });
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    logger.error('Error deleting comment:', err);
    next(err);
  }
});

export default router;
