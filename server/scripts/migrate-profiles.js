import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { syncUserIdentity } from '../utils/userIdentity.js';

dotenv.config();

const deptMapping = {
  'CSE': 'CSE',
  'ECE': 'ECE',
  'EEE': 'EEE',
  'IT': 'IT',
  'MECH': 'Mechanical',
  'MECHANICAL': 'Mechanical',
  'CHEM': 'Chemical',
  'CHEMICAL': 'Chemical',
  'BIOMEDICAL': 'Biomedical',
  'CIVIL': 'Civil',
  'ENGLISH': 'English'
};

async function migrate() {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    logger.info('Connected to DB');

    const users = await User.find({});
    logger.info(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      let updated = false;

      // 1. Map Department
      if (user.dept) {
        const normalized = user.dept.toUpperCase().trim();
        if (deptMapping[normalized] && user.dept !== deptMapping[normalized]) {
          logger.info(`Mapping dept for ${user.email}: ${user.dept} -> ${deptMapping[normalized]}`);
          user.dept = deptMapping[normalized];
          updated = true;
        }
      }

      updated = (await syncUserIdentity(User, user)) || updated;

      // 3. Ensure profileVisibility exists
      if (!user.profileVisibility) {
        user.profileVisibility = {
          showEmail: true,
          showSocialLinks: true,
          showInterests: true,
          showSkills: true,
          showBio: true,
          showEducation: true
        };
        updated = true;
      }

      if (updated) {
        await user.save();
      }
    }

    logger.info('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
