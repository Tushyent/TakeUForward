import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ApprovedAlumniEmail from '../models/ApprovedAlumniEmail.js';
import { assignDefaultCommunity } from '../utils/assignDefaultCommunity.js';
import { isSystemAdminEmail, syncUserIdentity } from '../utils/userIdentity.js';
import { logger } from '../utils/logger.js';

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
        const isSystemAdmin = isSystemAdminEmail(email);

        const isStudentEmail = /^[a-zA-Z]+\d{7}@ssn\.edu\.in$/.test(email);
        const isSsnDomain = email.endsWith('@ssn.edu.in');

        if (isSystemAdmin) {
          role = 'platform_admin';
        } else if (isStudentEmail) {
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

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
        if (!user) {
          // Attempt to extract dept/year from email or defaults (since it's not provided by Google directly)
          // For now we assume they might be null unless we can parse them, or we just leave them null
          let dept = null;
          let year = null;
          let defaultCommunityId = await assignDefaultCommunity(dept, year);

          // Non-SSN users must be approved by an admin before they can access the platform
          const isApproved = isSsnDomain || isSystemAdmin;

          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            role: role,
            dept: role === 'platform_admin' ? 'CSE' : dept,
            year: role === 'platform_admin' ? 2025 : year,
            defaultCommunityId,
            isVerifiedAlumni,
            isPlatformAdmin: isSystemAdmin,
            isApproved,
            ...(currentCompany && { currentCompany })
          });
          const changed = await syncUserIdentity(User, user);
          if (changed) await user.save();

          if (isApproved) {
            try {
              const { sendWelcomeEmail } = await import('../config/mailer.js');
              const memberCount = await mongoose.model('User').countDocuments({ isApproved: true });
              sendWelcomeEmail(user, memberCount).catch(err => logger.error('Welcome email failed:', err));
            } catch (err) {
              logger.error('Failed to send welcome email on registration:', err);
            }
          }
        } else {
          if (user.googleId !== profile.id) {
            user.googleId = profile.id;
            await user.save();
          }
          // If the user already exists but just became a verified alumni, update them
          if (isVerifiedAlumni && !user.isVerifiedAlumni) {
            user.isVerifiedAlumni = true;
            user.role = 'alumni';
            if (currentCompany) user.currentCompany = currentCompany;
            await user.save();
          }
          const changed = await syncUserIdentity(User, user);
          if (changed) await user.save();
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
