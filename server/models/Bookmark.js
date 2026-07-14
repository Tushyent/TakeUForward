import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['post', 'resource', 'interview_experience', 'elective_suggestion'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' }
  },
  { timestamps: true }
);

bookmarkSchema.virtual('itemModel').get(function() {
  if (this.itemType === 'post') return 'Post';
  if (this.itemType === 'resource') return 'Resource';
  if (this.itemType === 'interview_experience') return 'InterviewExperience';
  if (this.itemType === 'elective_suggestion') return 'ElectiveSuggestion';
  return null;
});

// Ensure a user can only bookmark a specific item once
bookmarkSchema.index({ userId: 1, itemId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
