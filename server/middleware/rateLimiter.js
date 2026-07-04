import rateLimit from 'express-rate-limit';

export const postCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: { message: 'Too many posts created from this IP, please try again after 10 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});
