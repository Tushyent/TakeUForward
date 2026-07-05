import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users for @mentions
// @access  Private
router.get('/search', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  const { q } = req.query;
  if (!q || q.length < 1) {
    return res.json([]); // Return empty array if query is too short
  }

  try {
    // Escape regex special chars to prevent regex injection
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeQ, 'i');

    const users = await User.find({
      $or: [
        { handle: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    })
      .select('name handle')
      .limit(5)
      .lean();

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/users/:username
// @desc    Get public profile
// @access  Public (or Private depending on if we want guests to see it, I'll make it authenticated for now)
router.get('/:username', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Strip fields based on profileVisibility
    const vis = user.profileVisibility || {};
    
    // Always visible basic fields:
    const publicProfile = {
      _id: user._id,
      name: user.name,
      username: user.username,
      handle: user.handle,
      role: user.role,
      isVerifiedAlumni: user.isVerifiedAlumni,
      reputation: user.reputation,
      currentCompany: user.currentCompany,
    };

    if (vis.showEmail !== false) publicProfile.email = user.email;
    if (vis.showBio !== false) {
      publicProfile.bio = user.bio;
      publicProfile.about = user.about;
    }
    if (vis.showSocialLinks !== false) publicProfile.socialLinks = user.socialLinks;
    if (vis.showInterests !== false) publicProfile.interests = user.interests;
    if (vis.showSkills !== false) publicProfile.skills = user.skills;
    if (vis.showEducation !== false) {
      publicProfile.dept = user.dept;
      publicProfile.year = user.year;
      publicProfile.graduationYear = user.graduationYear;
      publicProfile.higherEducation = user.higherEducation;
    }

    res.json(publicProfile);
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/users/me/profile
// @desc    Update user profile and visibility
// @access  Private
router.patch('/me/profile', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { about, interests, skills, socialLinks, profileVisibility, weeklyDigestOptIn } = req.body;
    const user = req.user;

    if (about !== undefined) user.about = about;
    if (interests !== undefined) user.interests = interests;
    if (skills !== undefined) user.skills = skills;
    if (socialLinks !== undefined) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (profileVisibility !== undefined) user.profileVisibility = { ...user.profileVisibility, ...profileVisibility };
    if (weeklyDigestOptIn !== undefined) user.weeklyDigestOptIn = weeklyDigestOptIn;

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
