import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/takeuforward_dev');
    console.log('Connected to DB');

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      let updated = false;

      // 1. Map Department
      if (user.dept) {
        const normalized = user.dept.toUpperCase().trim();
        if (deptMapping[normalized] && user.dept !== deptMapping[normalized]) {
          console.log(`Mapping dept for ${user.email}: ${user.dept} -> ${deptMapping[normalized]}`);
          user.dept = deptMapping[normalized];
          updated = true;
        }
      }

      // 2. Backfill Username
      if (!user.username) {
        let usernameBase = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let username = usernameBase;
        let counter = 1;
        
        // Check for collisions inside the loop, though script is sequential so it's safe
        let collision = await User.findOne({ username, _id: { $ne: user._id } });
        while (collision) {
          username = `${usernameBase}${counter}`;
          counter++;
          collision = await User.findOne({ username, _id: { $ne: user._id } });
        }
        
        console.log(`Setting username for ${user.email}: ${username}`);
        user.username = username;
        updated = true;
      }

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

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
