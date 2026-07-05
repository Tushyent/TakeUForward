import mongoose from 'mongoose';

const careerRoadmapSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    careerPath: {
      type: String,
      enum: ['sde', 'pm', 'core', 'higher_studies', 'other'],
      required: true
    },
    title: { type: String, required: true, trim: true },
    steps: [
      {
        stepTitle: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        order: { type: Number, required: true }
      }
    ],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

careerRoadmapSchema.index({ careerPath: 1 });

const CareerRoadmap = mongoose.model('CareerRoadmap', careerRoadmapSchema);
export default CareerRoadmap;
