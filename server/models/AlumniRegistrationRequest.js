import mongoose from 'mongoose';

const alumniRegistrationRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    dept: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    currentCompany: { type: String }, // Can also represent higher education/masters info
    proofLink: { type: String, required: true }, // e.g. LinkedIn URL
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

alumniRegistrationRequestSchema.index({ status: 1, createdAt: -1 });
alumniRegistrationRequestSchema.index({ email: 1 });

const AlumniRegistrationRequest = mongoose.model('AlumniRegistrationRequest', alumniRegistrationRequestSchema);
export default AlumniRegistrationRequest;
