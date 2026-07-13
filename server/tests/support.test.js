import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import User from '../models/User.js';
import SupportTicket from '../models/SupportTicket.js';
import supportRoutes from '../routes/supportRoutes.js';

// Setup test app
const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Inject mock auth per test
app.use((req, res, next) => {
  if (req.mockUser) {
    req.isAuthenticated = () => true;
    req.user = req.mockUser;
  } else {
    req.isAuthenticated = () => false;
  }
  next();
});
app.use('/api/support', supportRoutes);

describe('SupportTicket API', () => {
  let regularUser;
  let adminUser;
  let legacyPlatformAdmin;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_support');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await SupportTicket.deleteMany({});
    
    regularUser = await User.create({
      name: 'Regular Student',
      email: 'student@ssn.edu.in',
      googleId: 'google1',
      role: 'student',
      isPlatformAdmin: false
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'takeuforwardssn@gmail.com',
      googleId: 'google2',
      role: 'platform_admin',
      username: 'admin',
      handle: 'admin',
      isPlatformAdmin: true
    });

    legacyPlatformAdmin = await User.create({
      name: 'Old Platform Admin',
      email: 'old-admin@ssn.edu.in',
      googleId: 'google3',
      role: 'platform_admin',
      username: 'oldadmin',
      handle: 'oldadmin',
      isPlatformAdmin: true
    });
  });

  it('allows authenticated users to create a ticket', async () => {
    app.request.mockUser = regularUser;

    const res = await request(app)
      .post('/api/support')
      .send({
        title: 'Need help with placement portal',
        description: 'Cannot login to CDC',
        category: 'bug',
        pageContext: '/home',
        displayNamePublicly: false
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Need help with placement portal');
    expect(res.body.authorId).toBe(regularUser._id.toString());
  });

  it('prevents non-admins from getting tickets', async () => {
    app.request.mockUser = regularUser;
    
    const res = await request(app).get('/api/support');
    
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('System admin access required');
  });

  it('prevents non-system platform admins from getting tickets', async () => {
    app.request.mockUser = legacyPlatformAdmin;

    const res = await request(app).get('/api/support');

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('System admin access required');
  });

  it('allows admins to get tickets', async () => {
    await SupportTicket.create({
      authorId: regularUser._id,
      title: 'Ticket 1',
      description: 'Desc',
      category: 'bug',
      displayNamePublicly: false
    });

    app.request.mockUser = adminUser;
    
    const res = await request(app).get('/api/support');
    
    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBe(1);
    
    // IMPORTANT: Verify Option B identity visibility
    // The admin MUST be able to see the authorId details even if displayNamePublicly is false
    expect(res.body.tickets[0].authorId._id.toString()).toBe(regularUser._id.toString());
    expect(res.body.tickets[0].authorId.name).toBe('Regular Student');
  });

  it('prevents non-admins from updating ticket status', async () => {
    const ticket = await SupportTicket.create({
      authorId: regularUser._id,
      title: 'Ticket 1',
      description: 'Desc',
      category: 'bug'
    });

    app.request.mockUser = regularUser;
    
    const res = await request(app)
      .patch(`/api/support/${ticket._id}/status`)
      .send({ status: 'resolved' });
    
    expect(res.status).toBe(403);
  });

  it('allows admins to update ticket status and admin notes', async () => {
    const ticket = await SupportTicket.create({
      authorId: regularUser._id,
      title: 'Ticket 1',
      description: 'Desc',
      category: 'bug'
    });

    app.request.mockUser = adminUser;
    
    const res = await request(app)
      .patch(`/api/support/${ticket._id}/status`)
      .send({ 
        status: 'resolved',
        adminNotes: 'Fixed the issue'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
    expect(res.body.adminNotes).toBe('Fixed the issue');
  });

  it('allows admins to reply to a ticket and creates a notification', async () => {
    const ticket = await SupportTicket.create({
      authorId: regularUser._id,
      title: 'Ticket for Reply',
      description: 'Desc',
      category: 'bug'
    });

    app.request.mockUser = adminUser;
    
    const res = await request(app)
      .post(`/api/support/${ticket._id}/reply`)
      .send({ 
        replyText: 'We are working on this now.',
        updateStatusTo: 'in_progress'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.ticket.status).toBe('in_progress');
    expect(res.body.ticket.adminReplies).toBeDefined();
    expect(res.body.ticket.adminReplies.length).toBe(1);
    expect(res.body.ticket.adminReplies[0].text).toContain('We are working on this now.');
    
    const Notification = (await import('../models/Notification.js')).default;
    const notifs = await Notification.find({ userId: regularUser._id });
    expect(notifs.length).toBeGreaterThan(0);
    const replyNotif = notifs.find(n => n.type === 'message' && n.targetPath === '/support');
    expect(replyNotif).toBeDefined();
    expect(replyNotif.contentPreview).toContain('We are working on this now.');
  });

  it('allows users to get their own tickets', async () => {
    app.request.mockUser = regularUser;

    await SupportTicket.create({
      authorId: regularUser._id,
      title: 'Ticket 1',
      description: 'Desc',
      category: 'bug'
    });
    
    await SupportTicket.create({
      authorId: adminUser._id, // different user
      title: 'Ticket 2',
      description: 'Desc',
      category: 'bug'
    });
    
    const res = await request(app).get('/api/support/my-tickets');
    
    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBe(1);
    expect(res.body.tickets[0].title).toBe('Ticket 1');
  });
});
