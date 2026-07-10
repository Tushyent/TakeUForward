import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ApprovedAlumniEmail from '../models/ApprovedAlumniEmail.js';
import { assignDefaultCommunity } from '../utils/assignDefaultCommunity.js';
import crypto from 'crypto';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'stub-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'stub-client-secret',
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let role;
        let isVerifiedAlumni = false;

        const isStudentEmail = /^[a-zA-Z]+\d{7}@ssn\.edu\.in$/.test(email);
        const isSsnDomain = email.endsWith('@ssn.edu.in');

        if (isStudentEmail) {
          role = 'student';
        } else if (isSsnDomain) {
          role = 'club_admin';
        } else {
          role = 'alumni';
        }

        let currentCompany = null;
        if (role === 'alumni') {
          const approvedAlumni = await ApprovedAlumniEmail.findOne({ email, status: 'verified' });
          if (approvedAlumni) {
            currentCompany = approvedAlumni.currentCompany;
            isVerifiedAlumni = true;
          }
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Attempt to extract dept/year from email or defaults (since it's not provided by Google directly)
          // For now we assume they might be null unless we can parse them, or we just leave them null
          let dept = null;
          let year = null;
          let defaultCommunityId = await assignDefaultCommunity(dept, year);

          let usernameBase = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let username = usernameBase;
          let counter = 1;
          while (await User.findOne({ username })) {
            username = `${usernameBase}${counter}`;
            counter++;
          }

          const baseHandle = profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const handle = `${baseHandle}_${crypto.randomBytes(2).toString('hex')}`;

          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            username,
            handle,
            role: role,
            dept,
            year,
            defaultCommunityId,
            isVerifiedAlumni,
            ...(currentCompany && { currentCompany })
          });
        } else {
          // If the user already exists but just became a verified alumni, update them
          if (isVerifiedAlumni && !user.isVerifiedAlumni) {
            user.isVerifiedAlumni = true;
            user.role = 'alumni';
            if (currentCompany) user.currentCompany = currentCompany;
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
