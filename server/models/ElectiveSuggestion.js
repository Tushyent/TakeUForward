import mongoose from 'mongoose';

const electiveSuggestionSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseCode: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ['nptel', 'college_elective', 'other'],
      required: true
    },
    semester: { type: String, required: true, trim: true },
    recommendation: {
      type: String,
      enum: ['recommend', 'neutral', 'avoid'],
      required: true
    },
    workloadRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxLength: 2000 },
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

electiveSuggestionSchema.index({ courseCode: 1 });
electiveSuggestionSchema.index({ platform: 1 });
electiveSuggestionSchema.index({ semester: 1 });

const ElectiveSuggestion = mongoose.model('ElectiveSuggestion', electiveSuggestionSchema);
export default ElectiveSuggestion;
