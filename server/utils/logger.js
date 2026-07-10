import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const logger = pino({
  level: logLevel,
  transport: isProduction
    ? undefined // Native structured JSON in production for PaaS logs
    : {
        target: 'pino-pretty', // Readable formatted logs in development
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
  // Ensure we don't accidentally log sensitive object keys if they slip through
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'googleId',
      'body.password',
      'body.token'
    ],
    remove: true,
  },
});
