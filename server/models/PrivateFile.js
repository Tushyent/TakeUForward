import mongoose from 'mongoose';

const privateFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    s3Key: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

const PrivateFile = mongoose.model('PrivateFile', privateFileSchema);
export default PrivateFile;
