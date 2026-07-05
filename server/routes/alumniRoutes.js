import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/alumni
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { company, dept, page = 1, limit = 20 } = req.query;
    
    const query = { role: 'alumni', isVerifiedAlumni: true };
    if (company) {
      query.currentCompany = { $regex: new RegExp(company, 'i') };
    }
    if (dept) {
      query.dept = dept;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alumni = await User.find(query)
      .select('name handle dept year currentCompany bio reputation isVerifiedAlumni username')
      .sort({ reputation: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      alumni,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (err) {
    console.error('Error fetching alumni directory:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
