import mongoose from 'mongoose';

const teamRequestSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventName: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ['hackathon', 'project', 'competition', 'other'],
      required: true
    },
    skillsNeeded: [{ type: String, trim: true }],
    teamSizeNeeded: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true, maxLength: 2000 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    applicants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, trim: true, maxLength: 500 },
        appliedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

teamRequestSchema.index({ eventType: 1 });
teamRequestSchema.index({ status: 1 });
teamRequestSchema.index({ authorId: 1 });

const TeamRequest = mongoose.model('TeamRequest', teamRequestSchema);
export default TeamRequest;
