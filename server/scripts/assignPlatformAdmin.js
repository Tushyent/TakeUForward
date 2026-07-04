import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const assignPlatformAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node assignPlatformAdmin.js <email>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev');
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User not found with email: ${email}`);
      process.exit(1);
    }

    user.isPlatformAdmin = true;
    await user.save();

    console.log(`Successfully granted platform admin rights to ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('Error assigning platform admin:', err);
    process.exit(1);
  }
};

assignPlatformAdmin();
