import express from 'express';
import Post from '../models/Post.js';

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
  return postObj;
};

// POST /api/posts
router.post('/', async (req, res) => {
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

    const posts = await Post.find({ communityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('authorId', 'name dept role'); // Populate author details

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
    const post = await Post.findById(req.params.id).populate('authorId', 'name dept role');
    
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

export default router;
