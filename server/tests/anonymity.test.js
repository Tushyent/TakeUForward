import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import postRoutes from '../routes/postRoutes.js';
import interviewExperienceRoutes from '../routes/interviewExperienceRoutes.js';
import Post from '../models/Post.js';
import InterviewExperience from '../models/InterviewExperience.js';
import User from '../models/User.js';
import Community from '../models/Community.js';

const app = express();
app.use(express.json());

// Mock authentication middleware
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
app.use('/api/interview-experiences', interviewExperienceRoutes);

describe('Anonymity Engine (Post Routes)', () => {
  let communityId;

  beforeAll(async () => {
    // We don't connect to a real DB, we can use an in-memory server or connect to the local dev DB for this simple test.
    // Assuming local MongoDB is running at the dev URI. 
    // In a real project, we would use mongodb-memory-server.
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_anonymity');
    await Post.deleteMany({});
    await User.deleteMany({});
    await Community.deleteMany({});

    const community = await Community.create({
      name: 'TestCommunity',
      type: 'general'
    });
    communityId = community._id;

    mockUser = await User.create({
      name: 'Test User',
      email: 'testuser@ssn.edu.in',
      googleId: 'google-test-id-1',
      role: 'student'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Post.deleteMany({});
  });

  it('should explicitly STRIP authorId when a post isAnonymous = true', async () => {
    // 1. Create anonymous post
    const createRes = await request(app)
      .post('/api/posts')
      .send({
        communityId,
        content: 'This is an anonymous post!',
        isAnonymous: true
      });
    
    expect(createRes.status).toBe(201);
    const postId = createRes.body._id;

    // 2. Fetch the post via GET /api/posts/:id
    const fetchRes = await request(app).get(`/api/posts/${postId}`);
    expect(fetchRes.status).toBe(200);

    // 3. Assertions
    expect(fetchRes.body.content).toBe('This is an anonymous post!');
    expect(fetchRes.body.isAnonymous).toBe(true);
    expect(fetchRes.body).not.toHaveProperty('authorId'); // Crucial anonymity check
  });

  it('should NOT strip authorId when a post isAnonymous = false', async () => {
    // 1. Create public post
    const createRes = await request(app)
      .post('/api/posts')
      .send({
        communityId,
        content: 'This is a public post!',
        isAnonymous: false
      });
    
    expect(createRes.status).toBe(201);
    const postId = createRes.body._id;

    // 2. Fetch the post via GET /api/posts/:id
    const fetchRes = await request(app).get(`/api/posts/${postId}`);
    expect(fetchRes.status).toBe(200);

    // 3. Assertions
    expect(fetchRes.body.content).toBe('This is a public post!');
    expect(fetchRes.body.isAnonymous).toBe(false);
    expect(fetchRes.body).toHaveProperty('authorId'); // Identity is exposed
    expect(fetchRes.body.authorId.name).toBe('Test User'); // Populated field
  });

  it('should strip authorId from lists (GET /api/posts)', async () => {
    // Create one public, one anon
    await request(app).post('/api/posts').send({ communityId, content: 'Public', isAnonymous: false });
    await request(app).post('/api/posts').send({ communityId, content: 'Anon', isAnonymous: true });

    const fetchRes = await request(app).get(`/api/posts?communityId=${communityId}`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.length).toBe(2);

    const publicPost = fetchRes.body.find(p => p.content === 'Public');
    const anonPost = fetchRes.body.find(p => p.content === 'Anon');

    expect(publicPost).toHaveProperty('authorId');
    expect(anonPost).not.toHaveProperty('authorId');
  });
  it('should explicitly STRIP authorId from anonymous comments, but keep them for public comments', async () => {
    // 1. Create a public post
    const createRes = await request(app)
      .post('/api/posts')
      .send({ communityId, content: 'Public post for comments', isAnonymous: false });
    const postId = createRes.body._id;

    // 2. Add an anonymous comment
    await request(app)
      .post(`/api/posts/${postId}/comment`)
      .send({ text: 'Anon comment', isAnonymous: true });

    // 3. Add a public comment
    await request(app)
      .post(`/api/posts/${postId}/comment`)
      .send({ text: 'Public comment', isAnonymous: false });

    // 4. Fetch the post and check comments
    const fetchRes = await request(app).get(`/api/posts/${postId}`);
    expect(fetchRes.status).toBe(200);

    const comments = fetchRes.body.comments;
    expect(comments.length).toBe(2);

    const anonComment = comments.find(c => c.text === 'Anon comment');
    const publicComment = comments.find(c => c.text === 'Public comment');

    expect(anonComment.isAnonymous).toBe(true);
    expect(anonComment).not.toHaveProperty('authorId');

    expect(publicComment.isAnonymous).toBe(false);
    expect(publicComment).toHaveProperty('authorId');
  });
});

describe('Anonymity Engine (Interview Experience Routes)', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_anonymity');
    await InterviewExperience.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await InterviewExperience.deleteMany({});
  });

  it('should explicitly STRIP authorId when an interview experience isAnonymous = true', async () => {
    const createRes = await request(app)
      .post('/api/interview-experiences')
      .send({
        company: 'Google',
        role: 'SWE',
        batchYear: 2026,
        rounds: [{ roundName: 'Round 1', description: 'DSA', difficulty: 4 }],
        overallOutcome: 'selected',
        isAnonymous: true
      });
    
    expect(createRes.status).toBe(201);
    
    const fetchRes = await request(app).get(`/api/interview-experiences`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.length).toBe(1);

    const exp = fetchRes.body[0];
    expect(exp.isAnonymous).toBe(true);
    expect(exp).not.toHaveProperty('authorId');
  });
});
