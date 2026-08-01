import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Community from '../models/Community.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const departments = [
  { short: 'CSE', full: 'Computer Science & Engineering' },
  { short: 'IT', full: 'Information Technology' },
  { short: 'ECE', full: 'Electronics & Communication Engineering' },
  { short: 'EEE', full: 'Electrical & Electronics Engineering' },
  { short: 'MECH', full: 'Mechanical Engineering' },
  { short: 'CHEM', full: 'Chemical Engineering' },
  { short: 'BIOMED', full: 'Biomedical Engineering' },
  { short: 'CIVIL', full: 'Civil Engineering' },
  { short: 'MTECH-CSE', full: 'M.Tech Computer Science & Engineering' },
];

const batches = [2026, 2027, 2028, 2029];

const staticCommunities = [
  { name: 'General', type: 'general', description: 'A place for everyone to discuss anything campus-related.' },
  { name: 'Placements', type: 'topic', description: 'Interview prep, off-campus drives, and placement tips.' },
];

const seedCommunities = async () => {
  try {
    const dbName = process.env.MONGODB_DB_NAME || (process.env.NODE_ENV === 'production' ? 'takeuforward' : 'takeuforward_dev');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev', { dbName });
    logger.info('Connected to MongoDB for seeding communities...');

    const communities = [...staticCommunities];

    for (const dept of departments) {
      for (const batch of batches) {
        communities.push({
          name: `${dept.short}'${String(batch).slice(2)}`,
          type: 'batch',
          description: `${dept.full} - batch of ${batch}.`,
        });
      }
    }

    let created = 0;
    for (const comm of communities) {
      const exists = await Community.findOne({ name: comm.name });
      if (!exists) {
        await Community.create(comm);
        logger.info(`Created community: ${comm.name}`);
        created++;
      } else {
        logger.info(`Community ${comm.name} already exists. Skipping.`);
      }
    }

    logger.info(`Seeding complete! Created ${created} new communities.`);
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding communities:', err);
    process.exit(1);
  }
};

seedCommunities();
