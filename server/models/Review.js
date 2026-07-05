import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  professorName: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isHidden: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

reviewSchema.index({ courseCode: 1 });
reviewSchema.index({ professorName: 1 });
reviewSchema.index({ semester: 1 });
reviewSchema.index({ authorId: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
