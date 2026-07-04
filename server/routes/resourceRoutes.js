import express from 'express';
import Resource from '../models/Resource.js';
import { generatePresignedUrl } from '../config/s3.js';

const router = express.Router();

// POST /api/resources/upload-url
router.post('/upload-url', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);
    res.status(200).json({ uploadUrl, fileUrl });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/resources
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { title, courseCode, semester, tags, fileUrl } = req.body;
    if (!title || !courseCode || !semester || !fileUrl) {
      return res.status(400).json({ error: 'title, courseCode, semester, and fileUrl are required' });
    }

    const resource = await Resource.create({
      title,
      courseCode,
      semester,
      tags: tags || [],
      fileUrl,
      uploaderId: req.user._id
    });

    res.status(201).json(resource);
  } catch (err) {
    console.error('Error creating resource:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/resources
router.get('/', async (req, res) => {
  try {
    const { courseCode, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (courseCode) {
      query.courseCode = { $regex: new RegExp(courseCode, 'i') };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('uploaderId', 'name dept role');

    res.status(200).json(resources);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('uploaderId', 'name dept role');
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    res.status(200).json(resource);
  } catch (err) {
    console.error('Error fetching resource:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
