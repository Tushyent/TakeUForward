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
  (req, res, next) => {
    const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    
    passport.authenticate('google', {
      successRedirect: getClientUrl(),
      failureRedirect: getClientUrl() + '/login?error=domain',
    })(req, res, next);
  }
);

// DEV LOGIN (Only active outside production)
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', async (req, res, next) => {
    try {
      const { role } = req.body;
      const User = (await import('../models/User.js')).default;
      let email = 'dev@ssn.edu.in';
      let name = 'Dev Admin';
      if (role === 'student') {
        email = 'devstudent1234567@ssn.edu.in';
        name = 'Dev Student';
      } else if (role === 'alumni') {
        email = 'devalumni@gmail.com';
        name = 'Dev Alumni';
      }
      
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          googleId: 'dev_mock_' + role,
          name,
          email,
          username: 'dev_' + role,
          role,
          dept: role === 'student' ? 'CSE' : undefined,
          year: role === 'student' ? 3 : undefined,
          isVerifiedAlumni: false // Let alumni be unverified by default to test flow
        });
      } else if (role === 'student' && (!user.dept || !user.year)) {
        user.dept = 'CSE';
        user.year = 3;
        await user.save();
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({ message: 'Dev login successful' });
      });
    } catch (err) {
      next(err);
    }
  });
}

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    let profileComplete = false;
    if (req.user.role === 'alumni') {
      profileComplete = !!(req.user.dept && req.user.graduationYear && req.user.currentCompany);
    } else if (req.user.role === 'club_admin') {
      profileComplete = !!req.user.clubId;
    } else {
      profileComplete = !!(req.user.dept && req.user.year);
    }
    res.status(200).json({ user: req.user, profileComplete });
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

    await req.user.save();
    res.status(200).json({ message: 'Profile updated', user: req.user, profileComplete: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    next(err);
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

router.post('/alumni/invite', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Must be logged in to invite alumni' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'alumni') {
    return res.status(403).json({ error: 'Only admins or verified alumni can generate invites' });
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
    console.error(err);
    next(err);
  }
});

export default router;
