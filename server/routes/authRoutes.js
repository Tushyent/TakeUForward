import express from 'express';
import passport from 'passport';
import crypto from 'crypto';
import ApprovedAlumniEmail from '../models/ApprovedAlumniEmail.js';
import { assignDefaultCommunity } from '../utils/assignDefaultCommunity.js';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=domain',
  }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const profileComplete = !!(req.user.dept && req.user.year);
    res.status(200).json({ user: req.user, profileComplete });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.patch('/profile', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { dept, year } = req.body;
    if (!dept || !year) {
      return res.status(400).json({ error: 'Dept and year are required' });
    }

    req.user.dept = dept;
    req.user.year = parseInt(year, 10);

    // Re-run the existing defaultCommunityId matching logic
    const defaultCommunityId = await assignDefaultCommunity(req.user.dept, req.user.year);
    if (defaultCommunityId) {
      req.user.defaultCommunityId = defaultCommunityId;
    }

    await req.user.save();
    res.status(200).json({ message: 'Profile updated', user: req.user, profileComplete: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    // Since we are using express-session, we might also want to destroy it
    req.session && req.session.destroy();
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.post('/alumni/invite', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Must be logged in to invite alumni' });
  }

  try {
    const { email, currentCompany } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    await ApprovedAlumniEmail.create({
      email,
      currentCompany,
      invitedBy: req.user._id,
      inviteToken,
      status: 'pending'
    });

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/alumni-invite/${inviteToken}`;
    res.status(201).json({ inviteLink });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already invited or token collision' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/alumni/invite/:token', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
