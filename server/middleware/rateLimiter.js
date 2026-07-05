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
