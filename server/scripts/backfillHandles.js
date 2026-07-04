import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillHandles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev');
    
    const users = await User.find({ handle: { $exists: false } });
    console.log(`Found ${users.length} users without handles. Fixing now...`);

    for (const user of users) {
      const baseHandle = user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'user';
      const handle = `${baseHandle}_${crypto.randomBytes(2).toString('hex')}`;
      user.handle = handle;
      await user.save();
      console.log(`Assigned handle @${handle} to ${user.email}`);
    }

    console.log('Finished backfilling handles!');
    process.exit(0);
  } catch (err) {
    console.error('Error backfilling handles:', err);
    process.exit(1);
  }
};

backfillHandles();
