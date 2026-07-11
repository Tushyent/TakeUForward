import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['reply', 'mention', 'comment', 'digest', 'message'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Points to related post/user depending on type
    targetPath: { type: String },
    contentPreview: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
