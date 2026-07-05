import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['post', 'resource'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' }
  },
  { timestamps: true }
);

bookmarkSchema.virtual('itemModel').get(function() {
  return this.itemType === 'post' ? 'Post' : 'Resource';
});

// Ensure a user can only bookmark a specific item once
bookmarkSchema.index({ userId: 1, itemId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
