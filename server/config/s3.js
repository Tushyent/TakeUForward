import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const generatePresignedUrl = async (fileName, fileType) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_BUCKET_NAME is missing');

  const key = `resources/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // URL expires in 5 minutes (300 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Generate the eventual file URL based on standard S3 URL formatting
  const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
};

export const validateObjectSize = async (key, maxSizeInBytes) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) throw new Error('AWS_BUCKET_NAME is missing');

  try {
    const command = new HeadObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);
    const size = response.ContentLength;

    if (size > maxSizeInBytes) {
      // Delete the oversized object
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return { valid: false, size };
    }
    return { valid: true, size };
  } catch (err) {
    if (err.name === 'NotFound') {
      return { valid: false, error: 'Object not found in S3' };
    }
    throw err;
  }
};
