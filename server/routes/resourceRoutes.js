import express from 'express';
import Resource from '../models/Resource.js';
import Bookmark from '../models/Bookmark.js';
import { deletePublicObjectByUrl, generatePresignedUrl, validateObjectSize } from '../config/s3.js';
import { summarizeResource } from '../services/geminiService.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { getPaginationParams } from '../utils/paginationUtils.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../services/activityLogger.js';
import { validateS3Url } from '../utils/urlValidator.js';

const router = express.Router();

// POST /api/resources/upload-url
router.post('/upload-url', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: { message: 'fileName and fileType are required' } });
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: { message: 'Invalid file type. Only PDF, JPEG, PNG, and DOC/DOCX are allowed.' } });
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeToExtMap = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
    };
    const allowedExts = mimeToExtMap[fileType];
    if (!allowedExts || !allowedExts.includes(ext)) {
      return res.status(400).json({ error: { message: 'File extension does not match the content type.' } });
    }

    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);
    res.status(200).json({ uploadUrl, fileUrl });
  } catch (err) {
    logger.error('Error generating presigned URL:', err);
    next(err);
  }
});

// POST /api/resources
router.post('/', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { title, courseCode, semester, tags, fileUrl } = req.body;
    if (!title || !courseCode || !semester || !fileUrl) {
      return res.status(400).json({ error: { message: 'title, courseCode, semester, and fileUrl are required' } });
    }

    if (typeof title !== 'string' || typeof courseCode !== 'string' || typeof fileUrl !== 'string') {
      return res.status(400).json({ error: { message: 'Invalid field types' } });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: { message: 'Title must be 200 characters or fewer' } });
    }

    if (courseCode.length > 20) {
      return res.status(400).json({ error: { message: 'Course code must be 20 characters or fewer' } });
    }

    if (!validateS3Url(fileUrl)) {
      return res.status(400).json({ error: { message: 'Invalid fileUrl. URL must strictly point to the approved S3 bucket resources path.' } });
    }

    // Extract S3 key from fileUrl (assumes https://bucket.s3.region.amazonaws.com/key format)
    const keyMatch = fileUrl.split('amazonaws.com/');
    if (keyMatch.length === 2) {
      const key = keyMatch[1];
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const sizeValidation = await validateObjectSize(key, MAX_SIZE);
      if (!sizeValidation.valid) {
        return res.status(400).json({ error: { message: sizeValidation.error || 'File size exceeds 10MB limit. The uploaded file has been discarded.' } });
      }
    }

    const resource = await Resource.create({
      title,
      courseCode,
      semester,
      tags: tags || [],
      fileUrl,
      uploaderId: req.user._id
    });

    await logActivity({ action: 'create', resource: 'Resource', resourceId: resource._id, description: 'Uploaded a resource', req, details: { title: resource.title, courseCode: resource.courseCode } });

    res.status(201).json(resource);

    // Run summarization asynchronously in the background so it doesn't block the frontend response
    summarizeResource(title, courseCode, tags || [], fileUrl)
      .then(async (summary) => {
        if (summary) {
          resource.aiSummary = summary;
          await resource.save();
        }
      })
      .catch((summaryErr) => {
        logger.error('Failed to summarize resource (non-fatal):', summaryErr);
      });
  } catch (err) {
    logger.error('Error creating resource:', err);
    next(err);
  }
});

// GET /api/resources
router.get('/', async (req, res, next) => {
  try {
    const { courseCode, q, uploaderId, page: pageQuery, limit: limitQuery } = req.query;
    const { limit, skip } = getPaginationParams(pageQuery, limitQuery);

    const query = {};
    if (uploaderId) query.uploaderId = uploaderId;
    if (courseCode) {
      const safeCourseCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.courseCode = { $regex: new RegExp(safeCourseCode, 'i') };
    }
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: new RegExp(safeQ, 'i') } },
        { tags: { $regex: new RegExp(safeQ, 'i') } }
      ];
    }

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploaderId', 'name dept role');

    res.status(200).json(resources);
  } catch (err) {
    logger.error('Error fetching resources:', err);
    next(err);
  }
});

// GET /api/resources/:id
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('uploaderId', 'name dept role');
    if (!resource) return res.status(404).json({ error: { message: 'Resource not found' } });

    res.status(200).json(resource);
  } catch (err) {
    logger.error('Error fetching resource:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Resource not found' } });
    }
    next(err);
  }
});

// DELETE /api/resources/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: { message: 'Resource not found' } });

    // Allow deletion if the user is a platform admin OR the original uploader
    if (!req.user.isPlatformAdmin && resource.uploaderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized to delete this resource' } });
    }

    await deletePublicObjectByUrl(resource.fileUrl);
    await Resource.findByIdAndDelete(req.params.id);
    await Bookmark.deleteMany({ itemType: 'resource', itemId: req.params.id });
    
    const actionDesc = req.user.isPlatformAdmin && resource.uploaderId.toString() !== req.user._id.toString() 
      ? 'Admin deleted a resource' 
      : 'User deleted their own resource';
    await logActivity({ action: 'delete', resource: 'Resource', resourceId: req.params.id, description: actionDesc, req });
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (err) {
    logger.error('Error deleting resource:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ error: { message: 'Resource not found' } });
    }
    next(err);
  }
});

export default router;
