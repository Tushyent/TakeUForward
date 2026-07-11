import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    handle: { type: String, unique: true, sparse: true },
    googleId: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true, index: true },
    role: {
      type: String,
      enum: ['student', 'alumni', 'club_admin', 'platform_admin'],
      default: 'student',
    },
    year: { type: Number, min: 2000, max: 2029 },
    dept: { 
      type: String,
      enum: ['EEE', 'ECE', 'CSE', 'IT', 'Mechanical', 'Chemical', 'Biomedical', 'Civil', 'English']
    },
    currentCompany: { type: String },
    previousCompany: { type: String },
    graduationYear: { type: Number, min: 2000, max: 2029 },
    higherEducation: { type: String },
    isVerifiedAlumni: { type: Boolean, default: false },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    bio: { type: String },
    about: { type: String },
    interests: [{ type: String }],
    skills: [{ type: String }],
    experience: [{ type: String }],
    projects: [{ type: String }],
    whatsappNumber: { type: String },
    socialLinks: {
      linkedin: { type: String },
      instagram: { type: String },
      github: { type: String }
    },
    profileVisibility: {
      showEmail: { type: Boolean, default: true },
      showSocialLinks: { type: Boolean, default: true },
      showInterests: { type: Boolean, default: true },
      showSkills: { type: Boolean, default: true },
      showExperience: { type: Boolean, default: true },
      showProjects: { type: Boolean, default: true },
      showWhatsapp: { type: Boolean, default: true },
      showBio: { type: Boolean, default: true },
      showEducation: { type: Boolean, default: true }
    },
    isAnonymousDefault: { type: Boolean, default: false },
    isPlatformAdmin: { type: Boolean, default: false },
    reputation: { type: Number, default: 0 },
    defaultCommunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    weeklyDigestOptIn: { type: Boolean, default: true },
    lastDigestSentAt: { type: Date },
    pushSubscriptions: [{
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      }
    }]
  },
  { timestamps: true }
);

userSchema.index({ dept: 1 });
userSchema.index({ currentCompany: 1 });

const User = mongoose.model('User', userSchema);
export default User;
