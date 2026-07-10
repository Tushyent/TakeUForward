import express from 'express';
import PrivateFile from '../models/PrivateFile.js';
import { generatePrivateUploadUrl, generatePrivateDownloadUrl, validateObjectSize } from '../config/s3.js';
import { postCreationLimiter } from '../middleware/rateLimiter.js';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

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

// POST /api/drive/upload-url
router.post('/upload-url', postCreationLimiter, async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: { message: 'Not authenticated' } });

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) return res.status(400).json({ error: { message: 'Missing file details' } });

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

    // Enforce 20MB limit for personal drive
    const validation = await validateObjectSize(key, 20 * 1024 * 1024);
    if (!validation.valid) {
      return res.status(400).json({ error: { message: validation.error || 'File size exceeds 20MB limit. The uploaded file has been discarded.' } });
    }

    const newFile = await PrivateFile.create({
      fileName,
      mimeType: fileType,
      size: validation.size || size || 0,
      s3Key: key,
      ownerId: req.user._id
    });

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

    const bucketName = process.env.AWS_BUCKET_NAME;
    if (bucketName) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: file.s3Key }));
    }

    await PrivateFile.findByIdAndDelete(file._id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
