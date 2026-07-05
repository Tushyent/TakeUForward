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

const ReferralRequest = mongoose.model('ReferralRequest', referralRequestSchema);
export default ReferralRequest;
