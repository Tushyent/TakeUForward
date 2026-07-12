import express from 'express';
import { logActivity } from '../services/activityLogger.js';
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
        { username: { $regex: regex } },
        { handle: { $regex: regex } },
        { name: { $regex: regex } }
      ]
    })
      .select('name username handle')
      .limit(5)
      .lean();

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/users/contacts
// @desc    Get all SSN users + admin for direct messaging
// @access  Private
router.get('/contacts', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { email: { $regex: /@ssn\.edu\.in$/i } },
        { isPlatformAdmin: true }
      ]
    })
      .select('name handle email dept role isVerifiedAlumni isPlatformAdmin')
      .sort({ isPlatformAdmin: -1, name: 1 })
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
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ error: { message: 'User not found' } });

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
    if (vis.showExperience !== false) publicProfile.experience = user.experience;
    if (vis.showProjects !== false) publicProfile.projects = user.projects;
    if (vis.showWhatsapp !== false && user.whatsappNumber) publicProfile.whatsappNumber = user.whatsappNumber;
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
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { about, interests, skills, experience, projects, whatsappNumber, socialLinks, profileVisibility, weeklyDigestOptIn } = req.body;
    const user = req.user;

    if (about !== undefined) user.about = about;
    if (interests !== undefined) user.interests = interests;
    if (skills !== undefined) user.skills = skills;
    if (experience !== undefined) user.experience = experience;
    if (projects !== undefined) user.projects = projects;
    if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;
    if (socialLinks !== undefined) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (profileVisibility !== undefined) user.profileVisibility = { ...user.profileVisibility, ...profileVisibility };
    if (weeklyDigestOptIn !== undefined) user.weeklyDigestOptIn = weeklyDigestOptIn;

    await user.save();
    await logActivity({ action: 'update', resource: 'User', resourceId: req.user._id, description: 'Updated user profile', req, details: { updatedFields: Object.keys(req.body) } });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
