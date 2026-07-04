import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Club from '../models/Club.js';
import { createNotification } from '../services/notificationService.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Strips authorId from post if isAnonymous is true.
 * Must be used on a Mongoose document or lean object.
 */
const applyAnonymity = (post) => {
  const postObj = post.toObject ? post.toObject() : { ...post };
  if (postObj.isAnonymous) {
    delete postObj.authorId;
  }
  if (postObj.comments && Array.isArray(postObj.comments)) {
    postObj.comments = postObj.comments.map(comment => {
      if (comment.isAnonymous) {
        delete comment.authorId;
      }
      return comment;
    });
  }
  return postObj;
};

// POST /api/posts
router.post('/', postCreationLimiter, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { communityId, isAnonymous, content, tags } = req.body;
    
    if (!communityId || !content) {
      return res.status(400).json({ error: 'communityId and content are required' });
    }

    const post = await Post.create({
      authorId: req.user._id,
      communityId,
      isAnonymous: Boolean(isAnonymous),
      content,
      tags: tags || {}
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
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const { communityId, page = 1, limit = 10 } = req.query;
    
    if (!communityId) {
      return res.status(400).json({ error: 'communityId is required' });
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const posts = await Post.find({ communityId, isHidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('authorId', 'name dept role handle')
      .populate('comments.authorId', 'name dept role handle')
      .populate('clubId', 'name'); // Populate club details for announcements

    const safePosts = posts.map(applyAnonymity);

    res.status(200).json(safePosts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'name dept role handle')
      .populate('comments.authorId', 'name dept role handle')
      .populate('clubId', 'name');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json(applyAnonymity(post));
  } catch (err) {
    console.error('Error fetching post:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', postCreationLimiter, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { text, isAnonymous } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

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
    await post.populate('comments.authorId', 'name dept role handle');
    
    // Find the newly added comment to apply anonymity just to it, or return the whole post
    res.status(201).json(applyAnonymity(post));
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/upvote
router.post('/:id/upvote', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userIdStr = req.user._id.toString();
    const upvoteIndex = post.upvotes.findIndex(id => id.toString() === userIdStr);

    if (upvoteIndex === -1) {
      post.upvotes.push(req.user._id);
    } else {
      post.upvotes.splice(upvoteIndex, 1);
    }

    await post.save();
    res.status(200).json({ upvoteCount: post.upvotes.length });
  } catch (err) {
    console.error('Error toggling upvote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/report
router.post('/:id/report', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Report reason is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userIdStr = req.user._id.toString();
    const alreadyReported = post.reports.some(r => r.userId.toString() === userIdStr);

    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this post' });
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
    console.error('Error reporting post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
