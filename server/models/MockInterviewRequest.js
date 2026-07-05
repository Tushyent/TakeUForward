import mongoose from 'mongoose';

const mockInterviewRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetCompany: { type: String, required: true },
    requestType: { type: String, enum: ['mock_interview', 'resume_review', 'both'], required: true },
    status: {
      type: String,
      enum: ['open', 'matched', 'closed'],
      default: 'open'
    },
    matchedMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

mockInterviewRequestSchema.index({ requesterId: 1 });
mockInterviewRequestSchema.index({ matchedMentorId: 1 });
mockInterviewRequestSchema.index({ status: 1, targetCompany: 1 });

const MockInterviewRequest = mongoose.model('MockInterviewRequest', mockInterviewRequestSchema);
export default MockInterviewRequest;
