import express from 'express';
import PrivateFile from '../models/PrivateFile.js';
import { generatePrivateUploadUrl, generatePrivateDownloadUrl, validateObjectSize, deleteObjectByKey } from '../config/s3.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { logActivity } from '../services/activityLogger.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/drive
// Get all private files for the user
router.get('/', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const files = await PrivateFile.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// Mock S3 upload for local development without AWS credentials
router.put('/mock-s3-upload', (req, res) => {
  res.status(200).send('Mock upload successful');
});

// POST /api/drive/upload-url
router.post('/upload-url', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) return res.status(400).json({ error: { message: 'Missing file details' } });

    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'text/plain',
      'text/csv',
      'application/json'
    ];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: { message: 'Invalid file type. Only standard documents, images, text, and zip archives are allowed.' } });
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeToExtMap = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
      'application/zip': ['zip'],
      'application/x-rar-compressed': ['rar'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
      'application/json': ['json']
    };
    const allowedExts = mimeToExtMap[fileType];
    if (!allowedExts || !allowedExts.includes(ext)) {
      return res.status(400).json({ error: { message: 'File extension does not match the content type.' } });
    }

    // Enforce 100MB total storage quota per user
    const totalSizeData = await PrivateFile.aggregate([
      { $match: { ownerId: req.user._id } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]);
    const currentTotalSize = totalSizeData.length > 0 ? totalSizeData[0].totalSize : 0;
    if (currentTotalSize >= 100 * 1024 * 1024) {
      return res.status(403).json({ error: { message: 'Storage quota exceeded. As TUF-SSN is under testing, we have certain limits, in future we will increase the limits.' } });
    }

    const { uploadUrl, key } = await generatePrivateUploadUrl(fileName, fileType, req.user._id.toString());
    res.status(200).json({ uploadUrl, key });
  } catch (err) {
    next(err);
  }
});

// POST /api/drive/confirm
router.post('/confirm', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { key, fileName, fileType, size } = req.body;
    if (!key || !fileName || !fileType) return res.status(400).json({ error: { message: 'Missing metadata' } });

    const userPrefix = `private/${req.user._id.toString()}/`;
    if (!key.startsWith(userPrefix) || key.includes('..') || key.includes('\\') || key.includes('//')) {
      return res.status(403).json({ error: { message: 'Unauthorized key path' } });
    }

    // Enforce 20MB limit for personal drive file
    const validation = await validateObjectSize(key, 20 * 1024 * 1024);
    if (!validation.valid) {
      return res.status(400).json({ error: { message: validation.error || 'File size exceeds 20MB limit. The uploaded file has been discarded.' } });
    }

    const fileSize = validation.size || size || 0;

    // Enforce 100MB total storage quota per user
    const totalSizeData = await PrivateFile.aggregate([
      { $match: { ownerId: req.user._id } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]);
    const currentTotalSize = totalSizeData.length > 0 ? totalSizeData[0].totalSize : 0;
    if (currentTotalSize + fileSize > 100 * 1024 * 1024) {
      // Clean up the rejected file from S3
      await deleteObjectByKey(key).catch(err => logger.error({ err }, 'S3 quota-rejected file cleanup failed'));
      return res.status(403).json({ error: { message: 'This upload exceeds your total storage quota of 100MB. Please delete some files first.' } });
    }

    const newFile = await PrivateFile.create({
      fileName,
      mimeType: fileType,
      size: fileSize,
      s3Key: key,
      ownerId: req.user._id
    });

    await logActivity({ action: 'upload', resource: 'PrivateFile', resourceId: newFile._id, description: 'Uploaded a file to drive', req, details: { fileName: newFile.fileName, fileSize: newFile.size } });

    res.status(201).json(newFile);
  } catch (err) {
    next(err);
  }
});

// GET /api/drive/:id/download
router.get('/:id/download', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const file = await PrivateFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: { message: 'File not found' } });
    if (file.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }

    const downloadUrl = await generatePrivateDownloadUrl(file.s3Key);
    res.json({ downloadUrl });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/drive/:id
router.delete('/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const file = await PrivateFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: { message: 'File not found' } });
    if (file.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Unauthorized' } });
    }

    await deleteObjectByKey(file.s3Key);

    await PrivateFile.findByIdAndDelete(file._id);
    await logActivity({ action: 'delete', resource: 'PrivateFile', resourceId: req.params.id, description: 'Deleted a drive file', req });
    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
