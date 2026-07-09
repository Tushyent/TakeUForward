import express from 'express';
import User from '../models/User.js';
import { getPaginationParams } from '../utils/paginationUtils.js';

const router = express.Router();

// GET /api/alumni
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { company, dept, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = { role: 'alumni', isVerifiedAlumni: true };
    if (company) {
      const safeCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.currentCompany = { $regex: new RegExp(safeCompany, 'i') };
    }
    if (dept) query.dept = dept;

    const alumni = await User.find(query)
      .select('name handle dept year currentCompany bio reputation isVerifiedAlumni username')
      .sort({ reputation: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      alumni,
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (err) {
    console.error('Error fetching alumni directory:', err);
    next(err);
  }
});

export default router;
