import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['dept', 'batch', 'general', 'topic'],
      required: true,
    },
    description: { type: String },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Community = mongoose.model('Community', communitySchema);
export default Community;
