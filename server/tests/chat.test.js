import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import chatRoutes from '../routes/chatRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

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

app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);

describe('1:1 Chat Messaging & Notifications', () => {
  let userA, userB;
  const originalNotificationEnv = {};

  beforeAll(async () => {
    for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
      originalNotificationEnv[key] = process.env[key];
      delete process.env[key];
    }

    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_chats');
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Notification.deleteMany({});

    userA = await User.create({
      name: 'User A',
      email: 'usera@ssn.edu.in',
      googleId: 'google-test-a',
      role: 'student'
    });

    userB = await User.create({
      name: 'User B',
      email: 'userb@ssn.edu.in',
      googleId: 'google-test-b',
      role: 'student'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    for (const [key, value] of Object.entries(originalNotificationEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  beforeEach(async () => {
    await Chat.deleteMany({});
    await Notification.deleteMany({});
  });

  it('should successfully send a message from A to B, verify B has the message, allow B to reply, and create notifications', async () => {
    // 1. Authenticate as User A
    mockUser = userA;

    // Send a message from A to B
    const sendRes = await request(app)
      .post(`/api/chats/${userB._id}/message`)
      .send({ text: 'Hello User B!' });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.messages.length).toBe(1);
    expect(sendRes.body.messages[0].text).toBe('Hello User B!');

    // Check if notification was created for B
    const notifsForB = await Notification.find({ userId: userB._id });
    expect(notifsForB.length).toBe(1);
    expect(notifsForB[0].type).toBe('message');
    expect(notifsForB[0].refId.toString()).toBe(userA._id.toString());
    expect(notifsForB[0].targetPath).toBe(`/chat/${userA._id}`);
    expect(notifsForB[0].contentPreview).toBe('Hello User B!');

    // 2. Authenticate as User B
    mockUser = userB;

    // B fetches their chats
    const chatsForB = await request(app).get('/api/chats');
    expect(chatsForB.status).toBe(200);
    expect(chatsForB.body.length).toBe(1);
    expect(chatsForB.body[0].messages[0].text).toBe('Hello User B!');

    // B replies to A
    const replyRes = await request(app)
      .post(`/api/chats/${userA._id}/message`)
      .send({ text: 'Hey User A, got your message!' });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.messages.length).toBe(2);
    expect(replyRes.body.messages[1].text).toBe('Hey User A, got your message!');

    // Check if notification was created for A
    const notifsForA = await Notification.find({ userId: userA._id });
    expect(notifsForA.length).toBe(1);
    expect(notifsForA[0].type).toBe('message');
    expect(notifsForA[0].refId.toString()).toBe(userB._id.toString());
    expect(notifsForA[0].targetPath).toBe(`/chat/${userB._id}`);
    expect(notifsForA[0].contentPreview).toBe('Hey User A, got your message!');
  });
});
