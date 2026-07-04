import mongoose from 'mongoose';

const approvedAlumniEmailSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    currentCompany: { type: String },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
    },
    inviteToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const ApprovedAlumniEmail = mongoose.model('ApprovedAlumniEmail', approvedAlumniEmailSchema);
export default ApprovedAlumniEmail;
