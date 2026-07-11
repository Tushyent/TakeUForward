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
  screenshotUrl: { type: String },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'wont_fix'],
    default: 'open'
  },
  adminNotes: { type: String },
  displayNamePublicly: { type: Boolean, default: false } // Option B model
}, { timestamps: true });

export default mongoose.model('SupportTicket', supportTicketSchema);
