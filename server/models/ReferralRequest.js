import mongoose from 'mongoose';

const referralRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetCompany: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'matched', 'closed'],
      default: 'open'
    },
    matchedAlumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

referralRequestSchema.index({ requesterId: 1 });
referralRequestSchema.index({ matchedAlumniId: 1 });
referralRequestSchema.index({ status: 1, targetCompany: 1 });

const ReferralRequest = mongoose.model('ReferralRequest', referralRequestSchema);
export default ReferralRequest;
