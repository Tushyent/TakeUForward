import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['student', 'alumni', 'club_admin'],
      default: 'student',
    },
    year: { type: Number },
    dept: { type: String },
    currentCompany: { type: String },
    isVerifiedAlumni: { type: Boolean, default: false },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    bio: { type: String },
    isAnonymousDefault: { type: Boolean, default: false },
    reputation: { type: Number, default: 0 },
    defaultCommunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
