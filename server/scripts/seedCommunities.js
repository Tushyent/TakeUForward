import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Community from '../models/Community.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedCommunities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev');
    console.log('Connected to MongoDB for seeding communities...');

    const communitiesToSeed = [
      {
        name: 'General',
        type: 'general',
        description: 'A place for everyone to discuss anything campus-related.',
      },
      {
        name: 'Placements',
        type: 'topic',
        description: 'Interview prep, off-campus drives, and placement tips.',
      },
      {
        name: 'CSE-2028',
        type: 'batch',
        description: 'Computer Science & Engineering batch of 2028.',
      }
    ];

    for (const comm of communitiesToSeed) {
      const exists = await Community.findOne({ name: comm.name });
      if (!exists) {
        await Community.create(comm);
        console.log(`Created community: ${comm.name}`);
      } else {
        console.log(`Community ${comm.name} already exists. Skipping.`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding communities:', err);
    process.exit(1);
  }
};

seedCommunities();
