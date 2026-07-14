import mongoose from 'mongoose';

const marketplaceItemSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['book', 'cycle', 'electronics', 'other'], 
    required: true 
  },
  price: { type: Number, required: true, min: 0 },
  condition: { 
    type: String, 
    enum: ['new', 'like_new', 'good', 'fair'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'sold'], 
    default: 'available' 
  },
  isHidden: { type: Boolean, default: false },
  reports: [{
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

marketplaceItemSchema.index({ category: 1, status: 1 });
marketplaceItemSchema.index({ status: 1 });

export default mongoose.model('MarketplaceItem', marketplaceItemSchema);
