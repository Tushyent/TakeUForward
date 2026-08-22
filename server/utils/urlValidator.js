/**
 * @file urlValidator.js
 * @description Utility to validate that academic resource URLs point strictly to the approved S3 bucket.
 * Mitigates Server-Side Request Forgery (SSRF) in document parsing operations.
 */

import { URL } from 'url';

export const validateS3Url = (fileUrl) => {
  if (!fileUrl) return false;
  try {
    const parsed = new URL(fileUrl);
    
    // In local development or test mode, if AWS is not configured, we use mock S3 paths.
    if (!process.env.AWS_ACCESS_KEY_ID) {
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        return parsed.protocol === 'http:' && 
               parsed.host.startsWith('localhost:') && 
               parsed.pathname.startsWith('/mock-s3/');
      }
    }

    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';
    
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname !== `${bucketName}.s3.${region}.amazonaws.com`) return false;
    if (parsed.port !== '' && parsed.port !== '443') return false;
    if (parsed.username || parsed.password) return false;
    if (!parsed.pathname.startsWith('/resources/')) return false;
    
    return true;
  } catch {
    return false;
  }
};
