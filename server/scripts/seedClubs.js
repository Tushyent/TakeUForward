import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Club from '../models/Club.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedClubs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev');
    logger.info('Connected to MongoDB for seeding clubs...');

    const clubsToSeed = [
      {
        name: 'SSN Coding Club',
        description: 'The official coding club of SSN. We organize hackathons, competitive programming contests, and tech talks.',
      },
      {
        name: 'IEEE WIE SSN',
        description: 'IEEE Women in Engineering affinity group at SSN. Empowering women in tech through workshops and mentorship.',
      },
      {
        name: 'Lakshya SSN',
        description: 'The entrepreneurial cell of SSN. Fostering innovation and startup culture on campus.',
      }
    ];

    for (const club of clubsToSeed) {
      const exists = await Club.findOne({ name: club.name });
      if (!exists) {
        await Club.create(club);
        logger.info(`Created club: ${club.name}`);
      } else {
        logger.info(`Club ${club.name} already exists. Skipping.`);
      }
    }

    logger.info('Seeding complete!');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding clubs:', err);
    process.exit(1);
  }
};

seedClubs();
