import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { SYSTEM_ADMIN_EMAIL, syncUserIdentity } from '../utils/userIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const ensureSystemAdmin = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });

    let admin = await User.findOne({ email: SYSTEM_ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name: 'TakeUForward Admin',
        email: SYSTEM_ADMIN_EMAIL,
        googleId: 'system_admin_placeholder',
        role: 'platform_admin',
        dept: 'CSE',
        year: 2025,
        isPlatformAdmin: true
      });
    }

    const changed = await syncUserIdentity(User, admin);
    if (changed) await admin.save();

    logger.info(`System admin ready: ${SYSTEM_ADMIN_EMAIL} (@${admin.handle})`);
    process.exit(0);
  } catch (err) {
    logger.error('Error ensuring system admin:', err);
    process.exit(1);
  }
};

ensureSystemAdmin();
