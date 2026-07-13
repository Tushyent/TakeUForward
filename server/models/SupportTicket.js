import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  pageContext: { type: String }, // Which URL/page the issue was reported on
  category: { 
    type: String, 
    enum: ['bug', 'feature_request', 'other'],
    required: true
  },
  screenshotUrls: [{ type: String }],
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'wont_fix'],
    default: 'open'
  },
  adminNotes: { type: String },
  adminReplies: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  displayNamePublicly: { type: Boolean, default: false } // Option B model
}, { timestamps: true });

supportTicketSchema.index({ authorId: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('SupportTicket', supportTicketSchema);
