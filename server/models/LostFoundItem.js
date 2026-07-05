import mongoose from 'mongoose';

const lostFoundItemSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['lost', 'found'], required: true },
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    locationTag: { type: String, required: true }, // e.g., "Library", "CS Block"
    contactPreference: { type: String }, // "Message me via app"
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);
export default LostFoundItem;
