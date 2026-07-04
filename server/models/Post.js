import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    isAnonymous: { type: Boolean, default: false },
    type: { type: String, enum: ['question'], default: 'question' },
    tags: {
      dept: { type: String },
      year: { type: Number },
      courseCode: { type: String },
    },
    content: { type: String, required: true },
    
    comments: [{
      authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      isAnonymous: { type: Boolean, default: false },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      reason: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    isHidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
