/**
 * @file env.js
 * @description Centralized environment variable validation and configuration.
 * Validates required variables at startup and provides typed accessors.
 * Never logs secret values.
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Validates that a required env var is set in production.
 * In development/test, returns a safe fallback.
 * @param {string} key - Environment variable name
 * @param {string|undefined} devDefault - Safe fallback for dev/test only
 * @param {boolean} required - Whether this var is required in all environments
 * @returns {string}
 */
function requireEnv(key, devDefault, required = false) {
  const value = process.env[key];
  if (!value) {
    if (isProduction) {
      logger.error(`FATAL: Required environment variable "${key}" is missing in production. Shutting down.`);
      process.exit(1);
    }
    if (required) {
      logger.error(`FATAL: Required environment variable "${key}" is missing. Shutting down.`);
      process.exit(1);
    }
    if (!isTest) {
      logger.warn(`Environment variable "${key}" is not set. Using development default.`);
    }
    return devDefault ?? '';
  }
  return value;
}

// ─── Server ──────────────────────────────────────────────────────────────────
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Database ────────────────────────────────────────────────────────────────
export const MONGODB_URI = requireEnv('MONGODB_URI', 'mongodb://localhost:27017/takeuforward_dev');
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || (isProduction ? 'takeuforward' : 'takeuforward_dev');

// ─── Session (CRITICAL: no weak default in production) ───────────────────────
export const SESSION_SECRET = requireEnv('SESSION_SECRET', 'dev_secret_replace_me_32chars_min');

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export const GOOGLE_CLIENT_ID = requireEnv('GOOGLE_CLIENT_ID', '');
export const GOOGLE_CLIENT_SECRET = requireEnv('GOOGLE_CLIENT_SECRET', '');
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

// ─── Client ──────────────────────────────────────────────────────────────────
export const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

// ─── AWS S3 ───────────────────────────────────────────────────────────────────
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
export const AWS_PRIVATE_BUCKET_NAME = process.env.AWS_PRIVATE_BUCKET_NAME || '';

// ─── Email ────────────────────────────────────────────────────────────────────
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

// ─── AI ───────────────────────────────────────────────────────────────────────
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ─── Push Notifications ───────────────────────────────────────────────────────
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

// ─── System Admin ─────────────────────────────────────────────────────────────
// Read from env; fall back to a compile-time default only as last resort.
// IMPORTANT: This value is used for privilege elevation — move to env in production.
export const SYSTEM_ADMIN_EMAIL = (
  process.env.SYSTEM_ADMIN_EMAIL || 'takeuforwardssn@gmail.com'
).trim().toLowerCase();

if (isProduction && !process.env.SYSTEM_ADMIN_EMAIL) {
  logger.warn('SYSTEM_ADMIN_EMAIL is not set in environment. Using embedded default. Set this env var for easy rotation.');
}

// ─── Feature Flags ────────────────────────────────────────────────────────────
export const ENABLE_DIGEST = process.env.ENABLE_DIGEST === 'true';
export const ALLOW_TEST_SESSION = !isProduction && process.env.ALLOW_TEST_SESSION === 'true';

// ─── Content Limits (centralized, not magic numbers) ──────────────────────────
export const LIMITS = {
  POST_CONTENT: 5000,
  COMMENT_TEXT: 2000,
  CHAT_MESSAGE: 2000,
  MARKETPLACE_TITLE: 200,
  MARKETPLACE_DESCRIPTION: 2000,
  LOST_FOUND_ITEM_NAME: 200,
  LOST_FOUND_DESCRIPTION: 2000,
  SUPPORT_TITLE: 200,
  SUPPORT_DESCRIPTION: 5000,
  SEARCH_QUERY: 200,
  URL_FIELD: 500,
  SHORT_TEXT: 200,
};
