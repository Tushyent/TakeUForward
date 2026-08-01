import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import { logger } from '../utils/logger.js';
import { SYSTEM_ADMIN_EMAIL } from '../utils/userIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAnnouncement = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    logger.info('Connected to MongoDB for seeding announcement...');

    const admin = await User.findOne({ email: SYSTEM_ADMIN_EMAIL });
    if (!admin) {
      logger.error(`System admin (${SYSTEM_ADMIN_EMAIL}) not found in DB. Run ensureSystemAdmin first.`);
      process.exit(1);
    }

    const general = await Community.findOne({ name: 'General' });
    if (!general) {
      logger.error('General community not found. Seed communities first.');
      process.exit(1);
    }

    const existing = await Post.findOne({ type: 'announcement', authorId: admin._id, communityId: general._id });
    if (existing) {
      logger.info('Welcome announcement already exists. Skipping.');
      process.exit(0);
    }

    const content = [
      "Welcome to TakeUForward SSN! 👋",
      "",
      "Hey everyone! Welcome to TakeUForward SSN - a space built by students, for students.",
      "",
      "We know how it feels: the fear of missing out on the right electives, not knowing who to ask about a company's interview rounds, notes disappearing the moment a senior graduates, or just feeling like everyone else already knows something you don't. TakeUForward exists to fix exactly that.",
      "",
      "Here's what you can do here:",
      "- Ask questions (anonymously if you want) in your department and batch communities",
      "- Find and share notes, PYQs, and academic resources",
      "- Read real interview experiences and connect with alumni for referrals",
      "- Get paired with seniors for mock interviews and resume reviews",
      "- Find teammates for hackathons and projects",
      "- Post lost & found items, buy/sell things on the marketplace, and more",
      "",
      "This platform only works because of what students put into it. If something's missing, broken, or could be better - tell us. This is a community-driven platform, so don't be shy to start. Let's grow this together.",
      "",
      "Welcome aboard!",
      "- The TakeUForward SSN Team"
    ].join('\n');

    await Post.create({
      authorId: admin._id,
      communityId: general._id,
      type: 'announcement',
      content,
    });

    logger.info('Welcome announcement seeded successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding announcement:', err);
    process.exit(1);
  }
};

seedAnnouncement();
