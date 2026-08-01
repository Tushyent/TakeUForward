/**
 * anonymity_extended.test.js
 *
 * PART 4a: Anonymity-stripping tests for remaining content types.
 *
 * Findings from schema inspection:
 *  - Review model (Review.js):         HAS isAnonymous field. TESTED HERE.
 *  - Bookmark model (Bookmark.js):     Is a pointer/reference to a Post or Resource.
 *                                      Bookmarks themselves are not anonymous content;
 *                                      the underlying Post is. The bookmarkRoutes already
 *                                      apply applyAnonymity() to the populated post itemId.
 *                                      A bookmark does not expose a new `authorId` that
 *                                      could leak - it only has a `userId` (the bookmarker).
 *                                      No new anonymity test required for the Bookmark container
 *                                      itself; it is tested indirectly via Post anonymity.
 *  - LostFoundItem model:              NO isAnonymous field. Not designed for anonymity.
 *  - MarketplaceItem model:            NO isAnonymous field. Not designed for anonymity.
 *  - Moderation Queue (moderationRoutes.js):
 *                                      Calls applyAnonymity() on all posts/reviews/interview
 *                                      experiences before sending to the admin. TESTED HERE.
 */

import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import reviewRoutes from '../routes/reviewRoutes.js';
import moderationRoutes from '../routes/moderationRoutes.js';
import postRoutes from '../routes/postRoutes.js';
import bookmarkRoutes from '../routes/bookmarkRoutes.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Bookmark from '../models/Bookmark.js';

// ─── Shared Express App ───────────────────────────────────────────────────────
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

app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// ─── Reviews Anonymity ────────────────────────────────────────────────────────
describe('Anonymity Engine (Review Routes)', () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_anon_ext');
    await Review.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({
      name: 'Review Test User',
      email: 'reviewtest@ssn.edu.in',
      googleId: 'google-review-test-1',
      role: 'student',
    });
    mockUser = testUser;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Review.deleteMany({});
  });

  it('should STRIP authorId from a Review response when isAnonymous = true', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .send({
        courseCode: 'CS101',
        professorName: 'Dr. Smith',
        semester: 'Odd 2025',
        rating: 4,
        comment: 'Good course',
        isAnonymous: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.isAnonymous).toBe(true);
    expect(createRes.body).not.toHaveProperty('authorId');
  });

  it('should NOT strip authorId from a Review response when isAnonymous = false', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .send({
        courseCode: 'CS102',
        professorName: 'Dr. Jones',
        semester: 'Even 2025',
        rating: 5,
        comment: 'Excellent professor',
        isAnonymous: false,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.isAnonymous).toBe(false);
    expect(createRes.body).toHaveProperty('authorId');
    expect(createRes.body.authorId.name).toBe('Review Test User');
  });

  it('should strip authorId from anonymous reviews in the list endpoint (GET /api/reviews)', async () => {
    await request(app).post('/api/reviews').send({
      courseCode: 'CS201',
      professorName: 'Prof. Anonymous',
      semester: 'Odd 2025',
      rating: 3,
      comment: 'Average content',
      isAnonymous: true,
    });

    await request(app).post('/api/reviews').send({
      courseCode: 'CS202',
      professorName: 'Prof. Public',
      semester: 'Odd 2025',
      rating: 4,
      comment: 'Great content',
      isAnonymous: false,
    });

    const fetchRes = await request(app).get('/api/reviews');
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.reviews).toBeDefined();
    expect(fetchRes.body.reviews.length).toBe(2);

    const anonReview = fetchRes.body.reviews.find(r => r.professorName === 'Prof. Anonymous');
    const publicReview = fetchRes.body.reviews.find(r => r.professorName === 'Prof. Public');

    expect(anonReview).toBeDefined();
    expect(anonReview.isAnonymous).toBe(true);
    expect(anonReview).not.toHaveProperty('authorId');

    expect(publicReview).toBeDefined();
    expect(publicReview.isAnonymous).toBe(false);
    expect(publicReview).toHaveProperty('authorId');
  });
});

// ─── Moderation Queue Anonymity (Admin View) ──────────────────────────────────
describe('Anonymity Engine (Moderation Queue - Admin View)', () => {
  let adminUser;
  let communityId;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_anon_ext');
    await Post.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    await Community.deleteMany({});

    const community = await Community.create({ name: 'ModerationTest', type: 'general' });
    communityId = community._id;

    adminUser = await User.create({
      name: 'Platform Admin',
      email: 'takeuforwardssn@gmail.com',
      googleId: 'google-admin-1',
      role: 'platform_admin',
      username: 'admin',
      handle: 'admin',
      isPlatformAdmin: true,
    });
    mockUser = adminUser;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Post.deleteMany({});
    await Review.deleteMany({});
  });

  it('should NOT leak authorId in the moderation queue for a reported anonymous post', async () => {
    const anonymousAuthor = await User.create({
      name: 'Anonymous Author',
      email: 'anon_mod_author@ssn.edu.in',
      googleId: 'google-anon-mod-1',
      role: 'student',
    });

    const anonPost = await Post.create({
      authorId: anonymousAuthor._id,
      communityId,
      content: 'This is an anonymous post that got reported',
      isAnonymous: true,
      reports: [{ userId: adminUser._id, reason: 'Spam', createdAt: new Date() }],
    });

    expect(anonPost.authorId.toString()).toBe(anonymousAuthor._id.toString());

    const queueRes = await request(app).get('/api/moderation/queue');
    expect(queueRes.status).toBe(200);

    const reportedPost = queueRes.body.find(item => item._id === anonPost._id.toString());
    expect(reportedPost).toBeDefined();
    expect(reportedPost.isAnonymous).toBe(true);

    // CRITICAL: Even admin view must strip authorId for anonymous content
    expect(reportedPost).not.toHaveProperty('authorId');
  });

  it('should INCLUDE authorId in the moderation queue for a reported NON-anonymous post', async () => {
    const publicAuthor = await User.create({
      name: 'Public Author',
      email: 'public_mod_author@ssn.edu.in',
      googleId: 'google-public-mod-1',
      role: 'student',
    });

    const publicPost = await Post.create({
      authorId: publicAuthor._id,
      communityId,
      content: 'This is a public post that got reported',
      isAnonymous: false,
      reports: [{ userId: adminUser._id, reason: 'Harassment', createdAt: new Date() }],
    });

    const queueRes = await request(app).get('/api/moderation/queue');
    expect(queueRes.status).toBe(200);

    const reportedPost = queueRes.body.find(item => item._id === publicPost._id.toString());
    expect(reportedPost).toBeDefined();
    expect(reportedPost.isAnonymous).toBe(false);
    expect(reportedPost).toHaveProperty('authorId');
  });

  it('should NOT leak authorId in the moderation queue for a reported anonymous review', async () => {
    const anonReviewAuthor = await User.create({
      name: 'Anon Review Author',
      email: 'anonreview_mod@ssn.edu.in',
      googleId: 'google-anon-review-1',
      role: 'student',
    });

    const anonReview = await Review.create({
      authorId: anonReviewAuthor._id,
      courseCode: 'ANON101',
      professorName: 'Prof. Hidden',
      semester: 'Odd 2025',
      rating: 1,
      comment: 'This review should be anonymous',
      isAnonymous: true,
      reports: [{ userId: adminUser._id, reason: 'Inappropriate', createdAt: new Date() }],
    });

    const queueRes = await request(app).get('/api/moderation/queue');
    expect(queueRes.status).toBe(200);

    const reportedReview = queueRes.body.find(item => item._id === anonReview._id.toString());
    expect(reportedReview).toBeDefined();
    expect(reportedReview.isAnonymous).toBe(true);
    expect(reportedReview).not.toHaveProperty('authorId');
  });
});

// ─── Bookmark Anonymity ───────────────────────────────────────────────────────
describe('Anonymity Engine (Bookmarks)', () => {
  let bookmarker;
  let anonAuthor;
  let communityId;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_anon_ext');
    await Post.deleteMany({});
    await Bookmark.deleteMany({});
    await User.deleteMany({});
    await Community.deleteMany({});

    const community = await Community.create({ name: 'BookmarkTest', type: 'general' });
    communityId = community._id;

    bookmarker = await User.create({
      name: 'Bookmarker User',
      email: 'bookmarker@ssn.edu.in',
      googleId: 'google-bm-1',
      role: 'student',
    });

    anonAuthor = await User.create({
      name: 'Anon Post Author',
      email: 'anon_post@ssn.edu.in',
      googleId: 'google-anonpost-1',
      role: 'student',
    });

    mockUser = bookmarker;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Post.deleteMany({});
    await Bookmark.deleteMany({});
  });

  it('should NOT leak authorId when a user fetches their bookmarks containing an anonymous post', async () => {
    // 1. Create the anonymous post
    const anonPost = await Post.create({
      authorId: anonAuthor._id,
      communityId,
      content: 'This post is bookmarked but anonymous',
      isAnonymous: true,
    });

    // 2. Bookmarker bookmarks the post
    await Bookmark.create({
      userId: bookmarker._id,
      itemType: 'post',
      itemId: anonPost._id,
    });

    // 3. Bookmarker fetches their bookmarks
    const getRes = await request(app).get('/api/bookmarks?type=post');
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);

    const bookmarkItem = getRes.body[0];
    expect(bookmarkItem.itemType).toBe('post');
    expect(bookmarkItem.itemId).toBeDefined();

    // CRITICAL ASSERTION: The populated post MUST NOT contain authorId
    expect(bookmarkItem.itemId.isAnonymous).toBe(true);
    expect(bookmarkItem.itemId).not.toHaveProperty('authorId');
  });
});
