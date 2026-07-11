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

const assignPlatformAdmin = async () => {
  const email = process.argv[2] || SYSTEM_ADMIN_EMAIL;

  if (email.toLowerCase() !== SYSTEM_ADMIN_EMAIL) {
    logger.error(`Only ${SYSTEM_ADMIN_EMAIL} can be assigned as system admin.`);
    process.exit(1);
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    
    const user = await User.findOne({ email });
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      process.exit(1);
    }

    const changed = await syncUserIdentity(User, user);
    if (changed) await user.save();

    logger.info(`Successfully granted platform admin rights to ${email}`);
    process.exit(0);
  } catch (err) {
    logger.error('Error assigning platform admin:', err);
    process.exit(1);
  }
};

assignPlatformAdmin();
