import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import crypto from 'crypto';
import ApprovedAlumniEmail from '../models/ApprovedAlumniEmail.js';
import { assignDefaultCommunity } from '../utils/assignDefaultCommunity.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../services/activityLogger.js';
import { isSystemAdminEmail, isSystemAdminUser, syncUserIdentity } from '../utils/userIdentity.js';
import { sendWelcomeEmail } from '../config/mailer.js';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

    passport.authenticate('google', (err, user) => {
      const clientUrl = getClientUrl();
      if (err || !user) {
        logger.warn({ err: err?.message || 'User null or non-SSN email rejected', ip: req.ip }, 'Auth: Google OAuth login failed/rejected');
        return res.redirect(clientUrl + '/login?error=domain');
      }
      req.logIn(user, (err) => {
        if (err) {
          logger.error({ err: err.message, userId: user._id }, 'Auth: req.logIn session creation failed');
          return next(err);
        }
        logger.info({ userId: user._id, email: user.email, role: user.role, isApproved: user.isApproved }, 'Auth: User logged in successfully via Google OAuth');
        // Render HTML with a client-side redirect instead of using a 302.
        // Chrome on Android drops Set-Cookie on 302 responses that are part
        // of the OAuth bounce chain. A 200 response + script redirect breaks
        // that detection and the cookie is stored correctly.
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        
        // Generate a cryptographically secure nonce for the inline script
        const nonce = crypto.randomBytes(16).toString('base64');
        
        // Explicitly set a strictly scoped CSP just for this callback page to allow the nonce
        res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'`);
        
        res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0D0E14; color: #fff; }
    .spinner { width: 40px; height: 40px; border: 4px solid #2a2b35; border-top-color: #7C6AF7; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div>
    <div class="spinner"></div>
    <p>Signing you in...</p>
  </div>
  <script nonce="${nonce}">window.location.replace('${clientUrl}');</script>
</body>
</html>`);
      });
    })(req, res, next);
  }
);



router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    let profileComplete = false;
    if (req.user.isPlatformAdmin || req.user.role === 'platform_admin') {
      profileComplete = true;
    } else if (req.user.role === 'alumni') {
      profileComplete = !!(req.user.dept && req.user.graduationYear && req.user.currentCompany);
    } else if (req.user.role === 'club_admin') {
      profileComplete = !!req.user.clubId;
    } else {
      profileComplete = !!(req.user.dept && req.user.year);
    }
    const isApproved = req.user.isApproved !== false;
    res.status(200).json({ user: req.user, profileComplete, isApproved });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.patch('/profile', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { dept, year, graduationYear, currentCompany, previousCompany, higherEducation } = req.body;

    const oldDept = req.user.dept;
    const oldYear = req.user.year;
    const oldGradYear = req.user.graduationYear;
    const oldClubId = req.user.clubId;

    if (req.user.role === 'alumni') {
      if (!dept || !graduationYear || !currentCompany) {
        return res.status(400).json({ error: 'Dept, graduation year, and current company are required' });
      }
      req.user.dept = dept;
      req.user.graduationYear = parseInt(graduationYear, 10);
      req.user.currentCompany = currentCompany;
      if (previousCompany !== undefined) req.user.previousCompany = previousCompany;
      if (higherEducation !== undefined) req.user.higherEducation = higherEducation;
    } else if (req.user.role === 'club_admin') {
      const { clubName, clubDescription } = req.body;
      if (!clubName || !clubDescription) {
        return res.status(400).json({ error: 'Club Name and Description are required' });
      }
      
      const Club = (await import('../models/Club.js')).default;
      let club = await Club.findOne({ name: clubName });
      
      if (!club) {
        club = await Club.create({
          name: clubName,
          description: clubDescription,
          adminIds: [req.user._id]
        });
      } else {
        if (!club.adminIds.includes(req.user._id)) {
          club.adminIds.push(req.user._id);
          await club.save();
        }
      }
      
      req.user.clubId = club._id;
    } else {
      if (!dept || !year) {
        return res.status(400).json({ error: 'Dept and year are required' });
      }
      req.user.dept = dept;
      req.user.year = parseInt(year, 10);

      // Re-run the existing defaultCommunityId matching logic for students
      const defaultCommunityId = await assignDefaultCommunity(req.user.dept, req.user.year);
      if (defaultCommunityId) {
        req.user.defaultCommunityId = defaultCommunityId;
      }
    }

    const isFirstCompletion = (
      (req.user.role === 'student' && !oldDept && !oldYear) ||
      (req.user.role === 'alumni' && !oldGradYear) ||
      (req.user.role === 'club_admin' && !oldClubId)
    );

    await req.user.save();
    await logActivity({ action: 'update', resource: 'User', resourceId: req.user._id, description: 'Updated profile', req, details: { updatedFields: Object.keys(req.body) } });
    const totalUsers = await mongoose.model('User').countDocuments({ isApproved: true });

    if (isFirstCompletion) {
      sendWelcomeEmail(req.user, totalUsers).catch((err) => {
        logger.warn({ err, to: req.user.email }, 'sendWelcomeEmail: failed (non-blocking)');
      });
    }

    res.status(200).json({ message: 'Profile updated', user: req.user, profileComplete: true, totalUsers });
  } catch (err) {
    logger.error('Error updating profile:', err);
    next(err);
  }
});

router.get('/logout', (req, res, next) => {
  const userId = req.user?._id;
  const email = req.user?.email;
  req.logout((err) => {
    if (err) {
      logger.error({ err: err.message, userId }, 'Auth: req.logout failed');
      return next(err);
    }
    // Since we are using express-session, we might also want to destroy it
    req.session && req.session.destroy();
    logger.info({ userId, email }, 'Auth: User logged out successfully');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.post('/alumni/invite', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Must be logged in to invite alumni' });
  }
  if (!isSystemAdminUser(req.user)) {
    return res.status(403).json({ error: 'Only the system admin can generate invites' });
  }

  try {
    const { email, currentCompany } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    const record = await ApprovedAlumniEmail.create({
      email,
      currentCompany,
      invitedBy: req.user._id,
      inviteToken,
      status: 'pending'
    });
    await logActivity({ action: 'create', resource: 'ApprovedAlumniEmail', resourceId: record._id, description: `Admin invited alumni ${email}`, req });

    const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const inviteLink = `${getClientUrl()}/alumni-invite/${inviteToken}`;
    res.status(201).json({ inviteLink });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already invited or token collision' });
    }
    next(err);
  }
});

router.get('/alumni/invite/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await ApprovedAlumniEmail.findOne({ inviteToken: token });

    if (!invite) {
      return res.status(400).json({ error: 'Invalid invite token' });
    }

    if (invite.status === 'verified') {
      return res.status(400).json({ error: 'Invite token already used' });
    }

    invite.status = 'verified';
    await invite.save();

    res.status(200).json({ message: 'Invite accepted, you can now log in with Google' });
  } catch (err) {
    logger.error(err);
    next(err);
  }
});

// TEST-ONLY SESSION SEEDING
// This endpoint seeds a real Passport session from a DB user
// so E2E tests can bypass Google OAuth, which is not automatable in CI.
if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_SESSION === 'true') {
  router.post('/test-session', async (req, res, next) => {
    try {
      const User = (await import('../models/User.js')).default;
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          googleId: `playwright_${email.replace(/[@.]/g, '_')}`,
          email,
          name: 'Playwright Test User',
          role: isSystemAdminEmail(email) ? 'platform_admin' : 'student',
          dept: 'CSE',
          year: 2025,
          isPlatformAdmin: isSystemAdminEmail(email)
        });
      }
      const changed = await syncUserIdentity(User, user);
      if (changed) await user.save();
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json({ message: 'Test session seeded', user });
      });
    } catch (err) {
      next(err);
    }
  });
}

// POST /api/auth/alumni/request
// Public route for alumni to request access without a pre-approved email
router.post('/alumni/request', async (req, res, next) => {
  try {
    const { name, email, dept, graduationYear, currentCompany, proofLink, message } = req.body;
    
    if (!name || !email || !dept || !graduationYear || !proofLink) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }

    const AlumniRegistrationRequest = (await import('../models/AlumniRegistrationRequest.js')).default;
    
    // Check if there is already a pending request for this email
    const existing = await AlumniRegistrationRequest.findOne({ email, status: 'pending' });
    if (existing) {
      return res.status(400).json({ error: { message: 'A pending request for this email already exists' } });
    }

    await AlumniRegistrationRequest.create({
      name,
      email,
      dept,
      graduationYear,
      currentCompany,
      proofLink,
      message,
    });

    res.status(201).json({ message: 'Request submitted successfully. Admins will review your request.' });
  } catch (err) {
    logger.error('Error submitting alumni request:', err);
    next(err);
  }
});

export default router;
