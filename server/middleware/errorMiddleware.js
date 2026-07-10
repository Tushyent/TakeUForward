import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Log the error securely without exposing full request bodies or secrets
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
    userId: req.user?._id || 'unauthenticated',
    error: message
  };

  if (statusCode >= 500) {
    logger.error({ ...logContext, stack: err.stack }, 'Unexpected Server Error');
  } else if (statusCode >= 400) {
    // 404s can just be info to avoid log spam, other 4xx as warnings
    if (statusCode === 404) {
      logger.info(logContext, 'Client Error: Not Found');
    } else {
      logger.warn(logContext, 'Client Error');
    }
  }

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    },
  });
};
