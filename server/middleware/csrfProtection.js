/**
 * @file csrfProtection.js
 * @description CSRF protection middleware verifying Origin/Referer request headers.
 */

import { logger } from '../utils/logger.js';
import { URL } from 'url';

export const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Whitelist weekly digest cron webhook
  if (req.path === '/api/jobs/weekly-digest' || req.originalUrl === '/api/jobs/weekly-digest') {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const allowedOrigins = [
    clientUrl,
    'https://takeuforward.blastorz.fun',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  const checkMatch = (sourceUrl) => {
    if (!sourceUrl) return false;
    
    // Exact allowed origins check or startsWith check for paths (e.g. Referer)
    const isAllowedOrigin = allowedOrigins.some(ao => sourceUrl === ao || sourceUrl.startsWith(ao + '/'));
    if (isAllowedOrigin) return true;

    // Vercel preview environments domain verification (e.g. takeuforward-<hash>-tushyents-projects.vercel.app)
    try {
      const parsed = new URL(sourceUrl);
      if (/^takeuforward-[a-z0-9\-]+-tushyents-projects\.vercel\.app$/.test(parsed.hostname)) {
        return true;
      }
    } catch {
      // Fallback regex matching on the raw string if URL parsing fails
      if (/^https:\/\/takeuforward-[a-z0-9\-]+-tushyents-projects\.vercel\.app/.test(sourceUrl)) {
        return true;
      }
    }
    return false;
  };

  // CSRF validation checks both Origin and Referer. If both are absent, reject. If any is invalid, reject.
  if (!origin && !referer) {
    logger.warn({ path: req.path }, 'CSRF Blocked: Missing both Origin and Referer headers');
    return res.status(403).json({ error: { message: 'CSRF validation failed: Missing Origin or Referer header' } });
  }

  if (origin && !checkMatch(origin)) {
    logger.warn({ origin, path: req.path }, 'CSRF Blocked: Invalid Origin');
    return res.status(403).json({ error: { message: 'CSRF validation failed: Unauthorized request origin' } });
  }

  if (referer && !checkMatch(referer)) {
    logger.warn({ referer, path: req.path }, 'CSRF Blocked: Invalid Referer');
    return res.status(403).json({ error: { message: 'CSRF validation failed: Unauthorized request origin' } });
  }

  next();
};
