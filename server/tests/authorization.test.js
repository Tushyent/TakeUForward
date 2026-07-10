/**
 * authorization.test.js
 *
 * PART 4b: Authorization tests on mutating routes.
 *
 * For each feature area covered below, three scenarios are tested:
 *   1. Unauthenticated → 401
 *   2. Authenticated, wrong user (not the owner/authorized role) → 403
 *   3. Authenticated, correct owner → 200/success
 *
 * Feature areas covered:
 *   - Posts: delete (DELETE /api/posts/:id)
 *   - Comments: delete (DELETE /api/posts/:id/comments/:commentId)
 *   - ReferralRequest: close (PATCH /api/referrals/:id/close)
 *   - MockInterviewRequest: close (PATCH /api/mock-interviews/:id/close)
 *   - TeamRequest: close (POST /api/team-requests/:id/close)
 *   - Club Analytics: access (GET /api/clubs/:id/analytics)
 *   - Marketplace: mark-sold (PATCH /api/marketplace/:id/sold)
 *   - Lost & Found: resolve (POST /api/lost-found/:id/resolve)
 *   - Moderation: resolve (POST /api/moderation/:itemId/resolve)
 */

import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import postRoutes from '../routes/postRoutes.js';
import referralRoutes from '../routes/referralRoutes.js';
import mockInterviewRoutes from '../routes/mockInterviewRoutes.js';
import teamRequestRoutes from '../routes/teamRequestRoutes.js';
import clubRoutes from '../routes/clubRoutes.js';
import marketplaceRoutes from '../routes/marketplaceRoutes.js';
import lostFoundRoutes from '../routes/lostFoundRoutes.js';
import moderationRoutes from '../routes/moderationRoutes.js';

import Post from '../models/Post.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Club from '../models/Club.js';
import ReferralRequest from '../models/ReferralRequest.js';
import MockInterviewRequest from '../models/MockInterviewRequest.js';
import TeamRequest from '../models/TeamRequest.js';
import MarketplaceItem from '../models/MarketplaceItem.js';
import LostFoundItem from '../models/LostFoundItem.js';

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

let mockUser = null;

app.use((req, res, next) => {
  if (mockUser) {
    req.user = mockUser;
    req.isAuthenticated = () => true;
  } else {
    req.isAuthenticated = () => false;
  }
  next();
});

app.use('/api/posts', postRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/mock-interviews', mockInterviewRoutes);
app.use('/api/team-requests', teamRequestRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/moderation', moderationRoutes);

// ─── Test Data ────────────────────────────────────────────────────────────────
let ownerUser, otherUser, adminUser, communityId;

describe('Authorization Tests — Mutating Routes', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_authz');

    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Community.deleteMany({}),
      Club.deleteMany({}),
      ReferralRequest.deleteMany({}),
      MockInterviewRequest.deleteMany({}),
      TeamRequest.deleteMany({}),
      MarketplaceItem.deleteMany({}),
      LostFoundItem.deleteMany({}),
    ]);

    const community = await Community.create({ name: 'AuthzTestCommunity', type: 'general' });
    communityId = community._id;

    ownerUser = await User.create({
      name: 'Owner User',
      email: 'owner@ssn.edu.in',
      googleId: 'google-owner-1',
      role: 'student',
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other@ssn.edu.in',
      googleId: 'google-other-1',
      role: 'student',
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ssn.edu.in',
      googleId: 'google-admin-authz-1',
      role: 'student',
      isPlatformAdmin: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ─── POST DELETE ────────────────────────────────────────────────────────────
  describe('DELETE /api/posts/:id (post ownership)', () => {
    let postId;

    beforeEach(async () => {
      const post = await Post.create({
        authorId: ownerUser._id,
        communityId,
        content: 'Test post for deletion',
        isAnonymous: false,
      });
      postId = post._id.toString();
    });

    afterEach(async () => {
      await Post.deleteMany({});
    });

    it('401 — unauthenticated user cannot delete a post', async () => {
      mockUser = null;
      const res = await request(app).delete(`/api/posts/${postId}`);
      expect(res.status).toBe(401);
    });

    it('403 — authenticated non-owner cannot delete a post', async () => {
      mockUser = otherUser;
      const res = await request(app).delete(`/api/posts/${postId}`);
      expect(res.status).toBe(403);
    });

    it('200 — the owner can delete their own post', async () => {
      mockUser = ownerUser;
      const res = await request(app).delete(`/api/posts/${postId}`);
      expect(res.status).toBe(200);
    });
  });

  // ─── COMMENT DELETE ─────────────────────────────────────────────────────────
  describe('DELETE /api/posts/:id/comments/:commentId (comment ownership)', () => {
    let postId, commentId;

    beforeEach(async () => {
      mockUser = ownerUser;
      const post = await Post.create({
        authorId: ownerUser._id,
        communityId,
        content: 'Post with a comment',
        isAnonymous: false,
        comments: [{
          authorId: ownerUser._id,
          text: 'My comment',
          isAnonymous: false,
        }],
      });
      postId = post._id.toString();
      commentId = post.comments[0]._id.toString();
    });

    afterEach(async () => {
      await Post.deleteMany({});
    });

    it('401 — unauthenticated user cannot delete a comment', async () => {
      mockUser = null;
      const res = await request(app).delete(`/api/posts/${postId}/comments/${commentId}`);
      expect(res.status).toBe(401);
    });

    it('403 — authenticated non-owner cannot delete a comment', async () => {
      mockUser = otherUser;
      const res = await request(app).delete(`/api/posts/${postId}/comments/${commentId}`);
      expect(res.status).toBe(403);
    });

    it('200 — comment owner can delete their own comment', async () => {
      mockUser = ownerUser;
      const res = await request(app).delete(`/api/posts/${postId}/comments/${commentId}`);
      expect(res.status).toBe(200);
    });
  });

  // ─── REFERRAL REQUEST CLOSE ─────────────────────────────────────────────────
  describe('PATCH /api/referrals/:id/close (requester ownership)', () => {
    let referralId;

    beforeEach(async () => {
      const ref = await ReferralRequest.create({
        requesterId: ownerUser._id,
        targetCompany: 'Google',
        status: 'open',
      });
      referralId = ref._id.toString();
    });

    afterEach(async () => {
      await ReferralRequest.deleteMany({});
    });

    it('401 — unauthenticated user cannot close a referral request', async () => {
      mockUser = null;
      const res = await request(app).patch(`/api/referrals/${referralId}/close`);
      expect(res.status).toBe(401);
    });

    it('403 — a different user cannot close someone else\'s referral request', async () => {
      mockUser = otherUser;
      const res = await request(app).patch(`/api/referrals/${referralId}/close`);
      expect(res.status).toBe(403);
    });

    it('200 — the requester can close their own referral request', async () => {
      mockUser = ownerUser;
      const res = await request(app).patch(`/api/referrals/${referralId}/close`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
    });
  });

  // ─── MOCK INTERVIEW REQUEST CLOSE ───────────────────────────────────────────
  describe('PATCH /api/mock-interviews/:id/close (requester ownership)', () => {
    let mockInterviewId;

    beforeEach(async () => {
      const mi = await MockInterviewRequest.create({
        requesterId: ownerUser._id,
        targetCompany: 'Meta',
        requestType: 'mock_interview',
        status: 'open',
      });
      mockInterviewId = mi._id.toString();
    });

    afterEach(async () => {
      await MockInterviewRequest.deleteMany({});
    });

    it('401 — unauthenticated user cannot close a mock interview request', async () => {
      mockUser = null;
      const res = await request(app).patch(`/api/mock-interviews/${mockInterviewId}/close`);
      expect(res.status).toBe(401);
    });

    it('403 — a different user cannot close someone else\'s mock interview request', async () => {
      mockUser = otherUser;
      const res = await request(app).patch(`/api/mock-interviews/${mockInterviewId}/close`);
      expect(res.status).toBe(403);
    });

    it('200 — the requester can close their own mock interview request', async () => {
      mockUser = ownerUser;
      const res = await request(app).patch(`/api/mock-interviews/${mockInterviewId}/close`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
    });
  });

  // ─── TEAM REQUEST CLOSE ─────────────────────────────────────────────────────
  describe('POST /api/team-requests/:id/close (author ownership)', () => {
    let teamRequestId;

    beforeEach(async () => {
      const tr = await TeamRequest.create({
        authorId: ownerUser._id,
        eventName: 'HackFest',
        eventType: 'hackathon',
        teamSizeNeeded: 3,
        description: 'Looking for teammates',
        status: 'open',
      });
      teamRequestId = tr._id.toString();
    });

    afterEach(async () => {
      await TeamRequest.deleteMany({});
    });

    it('401 — unauthenticated user cannot close a team request', async () => {
      mockUser = null;
      const res = await request(app).post(`/api/team-requests/${teamRequestId}/close`);
      expect(res.status).toBe(401);
    });

    it('403 — a different user cannot close someone else\'s team request', async () => {
      mockUser = otherUser;
      const res = await request(app).post(`/api/team-requests/${teamRequestId}/close`);
      expect(res.status).toBe(403);
    });

    it('200 — the author can close their own team request', async () => {
      mockUser = ownerUser;
      const res = await request(app).post(`/api/team-requests/${teamRequestId}/close`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
    });
  });

  // ─── CLUB ANALYTICS (per-club admin scope) ──────────────────────────────────
  describe('GET /api/clubs/:id/analytics (club-admin scoped)', () => {
    let clubId;

    beforeAll(async () => {
      const club = await Club.create({
        name: 'CodeClub',
        description: 'A coding club',
        adminIds: [ownerUser._id],
      });
      clubId = club._id.toString();
    });

    afterAll(async () => {
      await Club.deleteMany({});
    });

    it('401 — unauthenticated user cannot view club analytics', async () => {
      mockUser = null;
      const res = await request(app).get(`/api/clubs/${clubId}/analytics`);
      expect(res.status).toBe(401);
    });

    it('403 — an authenticated user who is NOT this club\'s admin cannot view its analytics', async () => {
      mockUser = otherUser;
      const res = await request(app).get(`/api/clubs/${clubId}/analytics`);
      expect(res.status).toBe(403);
    });

    it('200 — the club\'s own admin can view their club analytics', async () => {
      mockUser = ownerUser;
      const res = await request(app).get(`/api/clubs/${clubId}/analytics`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPosts');
    });
  });

  // ─── MARKETPLACE MARK-SOLD ──────────────────────────────────────────────────
  describe('PATCH /api/marketplace/:id/sold (seller ownership)', () => {
    let marketplaceItemId;

    beforeEach(async () => {
      const item = await MarketplaceItem.create({
        sellerId: ownerUser._id,
        title: 'Used Textbook',
        description: 'Good condition',
        category: 'book',
        price: 200,
        condition: 'good',
        status: 'available',
      });
      marketplaceItemId = item._id.toString();
    });

    afterEach(async () => {
      await MarketplaceItem.deleteMany({});
    });

    it('401 — unauthenticated user cannot mark a marketplace item as sold', async () => {
      mockUser = null;
      const res = await request(app).patch(`/api/marketplace/${marketplaceItemId}/sold`);
      expect(res.status).toBe(401);
    });

    it('403 — a different user cannot mark someone else\'s item as sold', async () => {
      mockUser = otherUser;
      const res = await request(app).patch(`/api/marketplace/${marketplaceItemId}/sold`);
      expect(res.status).toBe(403);
    });

    it('200 — the seller can mark their own item as sold', async () => {
      mockUser = ownerUser;
      const res = await request(app).patch(`/api/marketplace/${marketplaceItemId}/sold`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('sold');
    });
  });

  // ─── LOST & FOUND RESOLVE ───────────────────────────────────────────────────
  describe('POST /api/lost-found/:id/resolve (author ownership)', () => {
    let lostFoundItemId;

    beforeEach(async () => {
      const item = await LostFoundItem.create({
        authorId: ownerUser._id,
        type: 'lost',
        itemName: 'Blue Umbrella',
        description: 'Lost near the library',
        locationTag: 'Library',
        dateLostFound: new Date(),
        status: 'open',
      });
      lostFoundItemId = item._id.toString();
    });

    afterEach(async () => {
      await LostFoundItem.deleteMany({});
    });

    it('401 — unauthenticated user cannot resolve a lost & found item', async () => {
      mockUser = null;
      const res = await request(app).post(`/api/lost-found/${lostFoundItemId}/resolve`);
      expect(res.status).toBe(401);
    });

    it('403 — a different user cannot resolve someone else\'s lost & found item', async () => {
      mockUser = otherUser;
      const res = await request(app).post(`/api/lost-found/${lostFoundItemId}/resolve`);
      expect(res.status).toBe(403);
    });

    it('200 — the author can resolve their own lost & found item', async () => {
      mockUser = ownerUser;
      const res = await request(app).post(`/api/lost-found/${lostFoundItemId}/resolve`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('resolved');
    });
  });

  // ─── MODERATION RESOLVE (Platform Admin only) ───────────────────────────────
  describe('POST /api/moderation/:itemId/resolve (platform admin only)', () => {
    let reportedPostId;

    beforeEach(async () => {
      const post = await Post.create({
        authorId: ownerUser._id,
        communityId,
        content: 'This post was reported',
        isAnonymous: false,
        reports: [{ userId: otherUser._id, reason: 'Spam', createdAt: new Date() }],
      });
      reportedPostId = post._id.toString();
    });

    afterEach(async () => {
      await Post.deleteMany({});
    });

    it('401 — unauthenticated user cannot resolve moderation actions', async () => {
      mockUser = null;
      const res = await request(app)
        .post(`/api/moderation/${reportedPostId}/resolve`)
        .send({ action: 'dismiss', type: 'post' });
      expect(res.status).toBe(401);
    });

    it('403 — a regular authenticated user (non-admin) cannot resolve moderation actions', async () => {
      mockUser = otherUser;
      const res = await request(app)
        .post(`/api/moderation/${reportedPostId}/resolve`)
        .send({ action: 'dismiss', type: 'post' });
      expect(res.status).toBe(403);
    });

    it('200 — a platform admin can dismiss a reported item', async () => {
      mockUser = adminUser;
      const res = await request(app)
        .post(`/api/moderation/${reportedPostId}/resolve`)
        .send({ action: 'dismiss', type: 'post' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/dismissed/i);
    });
  });
});
