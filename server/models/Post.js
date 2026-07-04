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
    
    // Future expansion as required by prompt
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
