import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { syncUserIdentity } from '../utils/userIdentity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillHandles = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    
    const users = await User.find({});
    logger.info(`Checking ${users.length} users for username/handle consistency...`);

    for (const user of users) {
      const changed = await syncUserIdentity(User, user);
      if (changed) {
        await user.save();
        logger.info(`Set @${user.handle} for ${user.email}`);
      }
    }

    logger.info('Finished backfilling usernames/handles!');
    process.exit(0);
  } catch (err) {
    logger.error('Error backfilling handles:', err);
    process.exit(1);
  }
};

backfillHandles();
