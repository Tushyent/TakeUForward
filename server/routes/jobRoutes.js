import express from 'express';
import { generateAndSendWeeklyDigests } from '../services/digestService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/jobs/weekly-digest
// Secured webhook for external cron services (e.g. cron-job.org)
router.post('/weekly-digest', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    logger.error('CRON_SECRET is not configured in environment variables');
    return res.status(500).json({ error: { message: 'Server misconfiguration: CRON_SECRET is not set.' } });
  }

  // Check shared secret in header
  const authHeader = req.headers['x-cron-secret'] || req.headers['authorization'];
  let providedSecret = authHeader;

  // Handle "Bearer <secret>" format if cron-job.org sends it that way
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.split(' ')[1];
  }

  if (providedSecret !== cronSecret) {
    logger.warn(`Unauthorized cron attempt with IP: ${req.ip}`);
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  // Acknowledge quickly (so external cron doesn't timeout) and run async
  // Render handles async processing if the process doesn't sleep immediately,
  // which it won't because the HTTP request woke it up.
  res.status(202).json({ message: 'Digest job started' });

  try {
    await generateAndSendWeeklyDigests();
  } catch (err) {
    logger.error('Error during weekly digest background job:', err);
  }
});

export default router;
