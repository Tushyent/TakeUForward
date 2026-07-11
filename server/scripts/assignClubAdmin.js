import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Club from '../models/Club.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const assignClubAdmin = async () => {
  const email = process.argv[2];
  const clubName = process.argv[3];

  if (!email || !clubName) {
    logger.error('Usage: node assignClubAdmin.js <email> "<club name>"');
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

    const club = await Club.findOne({ name: clubName });
    if (!club) {
      logger.error(`Club not found with name: ${clubName}`);
      process.exit(1);
    }

    // Add user to club admins
    if (!club.adminIds.includes(user._id)) {
      club.adminIds.push(user._id);
      await club.save();
    }

    // Update user role and clubId
    user.role = 'club_admin';
    user.clubId = club._id;
    await user.save();

    logger.info(`Successfully assigned ${email} as admin for ${clubName}`);
    process.exit(0);
  } catch (err) {
    logger.error('Error assigning club admin:', err);
    process.exit(1);
  }
};

assignClubAdmin();
