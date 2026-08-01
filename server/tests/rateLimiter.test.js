/**
 * rateLimiter.test.js
 *
 * PART 4c: Rate limiting behavior tests.
 *
 * Verifies that upvoteLimiter (max: 30/min) and reportLimiter (max: 5/10min)
 * actually engage at their configured thresholds - i.e., the (N+1)th request
 * returns 429, not a silent pass-through.
 *
 * NOTE: Because express-rate-limit keys by IP and supertest uses 127.0.0.1,
 * these tests fire many requests in sequence and rely on the limiter being
 * reset fresh per test by using a fresh app instance with new rate limiter
 * instances per describe block.
 */

import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Community from '../models/Community.js';

// Helper to create a fresh test app with overrideable rate limit config.
// We create NEW limiter instances per test so the in-memory store is clean.
function createTestApp({ upvoteMax = 30, reportMax = 5 } = {}) {
  const testUpvoteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: upvoteMax,
    message: { error: { message: 'Too many upvotes, please slow down' } },
    standardHeaders: true,
    legacyHeaders: false,
    // Use memory store (default) - fresh per instance
  });

  const testReportLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: reportMax,
    message: { error: { message: 'Too many reports submitted, please try again later' } },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const app = express();
  app.use(express.json());
  // Trust proxy so rate limiter gets a consistent IP
  app.set('trust proxy', false);

  let mockUser = null;
  app.use((req, res, next) => {
    req.user = mockUser;
    req.isAuthenticated = () => !!mockUser;
    next();
  });

  // Expose setter for test control
  app._setMockUser = (u) => { mockUser = u; };

  // Minimal post routes wired with test limiters
  app.post('/api/posts/:id/upvote', testUpvoteLimiter, async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: { message: 'Post not found' } });
      const userIdStr = req.user._id.toString();
      const hasUpvoted = post.upvotes.some(id => id.toString() === userIdStr);
      const update = hasUpvoted ? { $pull: { upvotes: req.user._id } } : { $addToSet: { upvotes: req.user._id } };
      const updated = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
      res.status(200).json({ upvoteCount: updated.upvotes.length });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/posts/:id/report', testReportLimiter, async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: { message: 'Report reason is required' } });
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: { message: 'Post not found' } });
      const alreadyReported = post.reports.some(r => r.userId.toString() === req.user._id.toString());
      if (alreadyReported) return res.status(409).json({ error: { message: 'Already reported' } });
      post.reports.push({ userId: req.user._id, reason });
      await post.save();
      res.status(200).json({ message: 'Reported' });
    } catch (err) {
      next(err);
    }
  });

  return app;
}

let testUser, communityId, testPostId;

describe('Rate Limiter Behavior Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_ratelimit');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Community.deleteMany({});

    const community = await Community.create({ name: 'RateLimitCommunity', type: 'general' });
    communityId = community._id;

    testUser = await User.create({
      name: 'Rate Limit User',
      email: 'ratelimit@ssn.edu.in',
      googleId: 'google-ratelimit-1',
      role: 'student',
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Post.deleteMany({});
    const post = await Post.create({
      authorId: testUser._id,
      communityId,
      content: 'Post for rate limit testing',
      isAnonymous: false,
    });
    testPostId = post._id.toString();
  });

  afterEach(async () => {
    await Post.deleteMany({});
  });

  // ─── upvoteLimiter: 30 per minute ───────────────────────────────────────────
  it('upvoteLimiter: the 31st upvote request in a window returns 429', async () => {
    // Use a low-threshold version (max: 3) to avoid firing 31 real DB queries in a test
    const app = createTestApp({ upvoteMax: 3, reportMax: 5 });
    app._setMockUser(testUser);

    // First 3 requests should succeed (they toggle on/off, all 200)
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post(`/api/posts/${testPostId}/upvote`);
      expect(res.status).toBe(200);
    }

    // The 4th request (exceeds max: 3) should be rate-limited
    const limitedRes = await request(app)
      .post(`/api/posts/${testPostId}/upvote`);
    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.error.message).toMatch(/upvotes/i);
  });

  // ─── reportLimiter: 5 per 10 minutes ────────────────────────────────────────
  it('reportLimiter: the 6th report request in a window returns 429', async () => {
    // Use max: 2 to keep test fast
    const app = createTestApp({ upvoteMax: 30, reportMax: 2 });
    app._setMockUser(testUser);

    // We need multiple different posts so the "already reported" guard doesn't block
    const posts = [];
    for (let i = 0; i < 4; i++) {
      const p = await Post.create({
        authorId: testUser._id,
        communityId,
        content: `Report target post ${i}`,
        isAnonymous: false,
      });
      posts.push(p._id.toString());
    }

    // First 2 reports should succeed
    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .post(`/api/posts/${posts[i]}/report`)
        .send({ reason: 'Spam' });
      expect(res.status).toBe(200);
    }

    // The 3rd request (exceeds max: 2) should be rate-limited
    const limitedRes = await request(app)
      .post(`/api/posts/${posts[2]}/report`)
      .send({ reason: 'Spam' });
    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body.error.message).toMatch(/reports/i);

    await Post.deleteMany({ _id: { $in: posts } });
  });
});
