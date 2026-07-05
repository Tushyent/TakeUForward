import mongoose from 'mongoose';

const interviewExperienceSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    batchYear: { type: Number, required: true },
    rounds: [
      {
        roundName: { type: String, required: true },
        description: { type: String, required: true },
        difficulty: { type: Number, min: 1, max: 5 } // 1-5 rating
      }
    ],
    overallOutcome: {
      type: String,
      enum: ['selected', 'rejected', 'withdrawn'],
      required: true
    },
    tags: [{ type: String }], // dept tags
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

interviewExperienceSchema.index({ company: 1 });
interviewExperienceSchema.index({ role: 1 });
interviewExperienceSchema.index({ batchYear: 1 });
interviewExperienceSchema.index({ isHidden: 1 });

const InterviewExperience = mongoose.model('InterviewExperience', interviewExperienceSchema);
export default InterviewExperience;
