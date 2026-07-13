import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    contactEmail: { type: String, trim: true },
    instagramHandle: { type: String, trim: true },
    adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Club = mongoose.model('Club', clubSchema);
export default Club;
