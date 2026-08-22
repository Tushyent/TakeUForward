import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import PrivateFile from '../models/PrivateFile.js';
import User from '../models/User.js';
import { S3Client } from '@aws-sdk/client-s3';

// Stub S3Client.prototype.send to avoid actual S3 network calls.
// This works perfectly in ESM since it modifies the prototype of S3Client.
const originalSend = S3Client.prototype.send;
beforeAll(() => {
  S3Client.prototype.send = async function (command) {
    const name = command.constructor.name;
    if (name === 'HeadObjectCommand') {
      const key = command.input.Key;
      if (key && key.includes('oversized')) {
        return { ContentLength: 50 * 1024 * 1024 }; // 50MB (exceeds 20MB limit)
      }
      return { ContentLength: 5 * 1024 * 1024 }; // 5MB (valid size)
    }
    if (name === 'DeleteObjectCommand') {
      return {};
    }
    return {};
  };

  // Set required bucket name env var for s3.js
  process.env.AWS_BUCKET_NAME = 'mock-tuf-bucket';
});

afterAll(() => {
  S3Client.prototype.send = originalSend;
});

// Import the routes that will use the stubbed S3Client
import privateFileRoutes from '../routes/privateFileRoutes.js';

const app = express();
app.use(express.json());

let mockUser = null;
app.use((req, res, next) => {
  if (mockUser) {
    req.user = mockUser;
    req.isAuthenticated = () => true;
  } else {
    req.isAuthenticated = () => false;
  }
  next();
});

app.use('/api/drive', privateFileRoutes);

describe('S3 Private Drive IDOR & Path Traversal Adversarial Verification', () => {
  let userA, userB;
  let fileA, fileB;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/takeuforward_test_drive_security');
    await User.deleteMany({});
    await PrivateFile.deleteMany({});

    userA = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'User A',
      email: 'usera@ssn.edu.in',
      googleId: 'google-a',
      role: 'student',
      isApproved: true
    });

    userB = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'User B',
      email: 'userb@ssn.edu.in',
      googleId: 'google-b',
      role: 'student',
      isApproved: true
    });

    fileA = await PrivateFile.create({
      fileName: 'usera-doc.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      s3Key: `private/${userA._id}/usera-doc.pdf`,
      ownerId: userA._id
    });

    fileB = await PrivateFile.create({
      fileName: 'userb-doc.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      s3Key: `private/${userB._id}/userb-doc.pdf`,
      ownerId: userB._id
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    mockUser = null;
  });

  // 1. Authenticated check
  it('blocks unauthenticated requests with 401', async () => {
    await request(app)
      .get('/api/drive')
      .expect(401);
  });

  // 2. confirm route IDOR checks
  describe('POST /confirm - key associations', () => {
    it('allows User A to confirm their own S3 key', async () => {
      mockUser = userA;
      await request(app)
        .post('/api/drive/confirm')
        .send({
          key: `private/${userA._id}/123456789-file.pdf`,
          fileName: 'file.pdf',
          fileType: 'application/pdf',
          size: 1024
        })
        .expect(201);
    });

    it('rejects User A attempting to confirm User B\'s S3 key path prefix', async () => {
      mockUser = userA;
      const res = await request(app)
        .post('/api/drive/confirm')
        .send({
          key: `private/${userB._id}/123456789-file.pdf`,
          fileName: 'file.pdf',
          fileType: 'application/pdf',
          size: 1024
        })
        .expect(403);
      expect(res.body.error.message).toMatch(/Unauthorized key path/i);
    });

    it('rejects User A attempting to confirm oversized file', async () => {
      mockUser = userA;
      const res = await request(app)
        .post('/api/drive/confirm')
        .send({
          key: `private/${userA._id}/123456789-oversized.pdf`,
          fileName: 'file.pdf',
          fileType: 'application/pdf',
          size: 1024
        })
        .expect(400);
      expect(res.body.error.message).toMatch(/exceeds 20MB limit/i);
    });

    it('rejects User A attempting path traversal to hijack other files', async () => {
      mockUser = userA;
      const traversals = [
        `private/${userA._id}/../${userB._id}/file.pdf`,
        `private/${userA._id}/..\\${userB._id}\\file.pdf`,
        `private/${userB._id}/../../something`,
        `private/${userA._id}//multiple-slashes/file.pdf`
      ];

      for (const t of traversals) {
        await request(app)
          .post('/api/drive/confirm')
          .send({
            key: t,
            fileName: 'file.pdf',
            fileType: 'application/pdf',
            size: 1024
          })
          .expect(403);
      }
    });
  });

  // 3. download route BOLA checks
  describe('GET /:id/download - object downloads', () => {
    it('allows User A to download their own file', async () => {
      mockUser = userA;
      const res = await request(app)
        .get(`/api/drive/${fileA._id}/download`)
        .expect(200);
      expect(res.body.downloadUrl).toBeDefined();
    });

    it('blocks User A from downloading User B\'s file', async () => {
      mockUser = userA;
      await request(app)
        .get(`/api/drive/${fileB._id}/download`)
        .expect(403);
    });
  });

  // 4. delete route BOLA checks
  describe('DELETE /:id - object deletions', () => {
    it('blocks User A from deleting User B\'s file', async () => {
      mockUser = userA;
      await request(app)
        .delete(`/api/drive/${fileB._id}`)
        .expect(403);

      // Verify B's file still exists in database
      const checkFile = await PrivateFile.findById(fileB._id);
      expect(checkFile).not.toBeNull();
    });

    it('allows User A to delete their own file', async () => {
      mockUser = userA;
      await request(app)
        .delete(`/api/drive/${fileA._id}`)
        .expect(200);

      // Verify A's file is removed from database
      const checkFile = await PrivateFile.findById(fileA._id);
      expect(checkFile).toBeNull();
    });
  });
});
