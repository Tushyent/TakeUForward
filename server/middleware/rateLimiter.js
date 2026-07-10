import rateLimit from 'express-rate-limit';

export const postCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: { message: 'Too many posts created from this IP, please try again after 10 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookmarkLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // Generous limit for bookmark toggles
  message: { error: { message: 'Too many bookmark actions, please wait 10 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const applyTeamLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 applications per 10 minutes
  message: { error: { message: 'Too many team applications, please wait 10 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const upvoteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 upvotes per minute — generous for normal use, blocks spam bots
  message: { error: { message: 'Too many upvotes, please slow down' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 reports per 10 min — high-risk spam vector, strict
  message: { error: { message: 'Too many reports submitted, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // 500 req/15min per IP — generous enough for real users (normal browsing is 40-80 req/session
  // but polling + StrictMode dev doubles can spike it). Still blocks scrapers and bots.
  // Per-route limiters (postCreationLimiter etc.) provide strict controls on write actions.
  max: 500,
  message: { error: { message: 'Too many requests from this IP, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

