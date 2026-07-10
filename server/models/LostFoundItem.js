import mongoose from 'mongoose';

const lostFoundItemSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['lost', 'found'], required: true, index: true },
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    locationTag: { type: String, required: true }, // e.g., "Library", "CS Block"
    dateLostFound: { type: Date, required: true, default: Date.now },
    imageUrl: { type: String }, // For photos of the item
    proofRequired: { type: String }, // To ask claimants for specific details to verify ownership
    contactPreference: { type: String }, // "Message me via app"
    whatsappNumber: { type: String },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  },
  { timestamps: true }
);

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);
export default LostFoundItem;
