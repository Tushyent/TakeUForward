import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ApprovedAlumniEmail from '../models/ApprovedAlumniEmail.js';
import { assignDefaultCommunity } from '../utils/assignDefaultCommunity.js';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'stub-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'stub-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'ssn.edu.in';
        
        let role = 'student';
        let currentCompany = null;

        // Domain restriction for students
        if (!email.endsWith(`@${allowedDomain}`)) {
          const approvedAlumni = await ApprovedAlumniEmail.findOne({ email, status: 'verified' });
          if (approvedAlumni) {
            role = 'alumni';
            currentCompany = approvedAlumni.currentCompany;
          } else {
            return done(null, false, { message: 'Unauthorized domain' });
          }
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Attempt to extract dept/year from email or defaults (since it's not provided by Google directly)
          // For now we assume they might be null unless we can parse them, or we just leave them null
          let dept = null;
          let year = null;
          let defaultCommunityId = await assignDefaultCommunity(dept, year);

          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            role: role,
            dept,
            year,
            defaultCommunityId,
            ...(currentCompany && { currentCompany })
          });
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
