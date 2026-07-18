import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger.js';

dotenv.config();

export class SendGridError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'SendGridError';
    this.code = code || 'UNKNOWN';
    this.statusCode = statusCode || null;
  }
}

class SendGridService {
  constructor() {
    this.apiKey = null;
    this.from = null;
    this.ready = false;
    this.sdkVersion = '8.1.0';

    this._init();
  }

  _init() {
    this.apiKey = process.env.SENDGRID_API_KEY || null;
    this.from = process.env.SENDGRID_FROM_EMAIL || null;

    if (!this.apiKey) {
      if (process.env.NODE_ENV !== 'test') {
        logger.warn('SendGridService: SENDGRID_API_KEY not set — all email sending disabled.');
      }
      return;
    }

    if (!this.from) {
      logger.warn(
        'SendGridService: SENDGRID_FROM_EMAIL not set — you must set SENDGRID_FROM_EMAIL to a verified sender in SendGrid.'
      );
    }

    try {
      sgMail.setApiKey(this.apiKey);
      this.ready = true;
      logger.info('SendGridService: initialized (from=%s, sdk=%s)', this.from, this.sdkVersion);
    } catch (err) {
      logger.error({ err }, 'SendGridService: failed to initialize SendGrid client');
    }
  }

  async send({ to, subject, html }) {
    if (this.ready && !process.env.SENDGRID_API_KEY) {
      this.ready = false;
      logger.warn('SendGridService: SENDGRID_API_KEY was removed from environment — deinitialized.');
    }

    if (!this.ready) {
      throw new SendGridError(
        'SendGridService not initialized — set SENDGRID_API_KEY environment variable',
        'CONFIG_ERROR'
      );
    }

    if (!to) {
      throw new SendGridError('Recipient email (to) is required', 'VALIDATION_ERROR', 400);
    }

    if (!subject) {
      throw new SendGridError('Email subject is required', 'VALIDATION_ERROR', 400);
    }

    if (!html) {
      throw new SendGridError('Email HTML body is required', 'VALIDATION_ERROR', 400);
    }

    const payload = { to, from: this.from, subject, html };

    logger.info(
      { from: this.from, to, subject },
      'SendGridService.send: sending email'
    );

    let result;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await sgMail.send(payload);
      clearTimeout(timeoutId);
      result = response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new SendGridError('Email send timed out after 15s', 'TIMEOUT');
      }
      if (err.response?.body?.errors) {
        const messages = err.response.body.errors.map(e => e.message).join('; ');
        throw new SendGridError(messages, 'SENDGRID_ERROR', err.response.statusCode || 500);
      }
      throw new SendGridError(err.message, err.code || 'NETWORK_ERROR');
    }

    const emailId = result[0]?.headers?.['x-message-id'] || null;
    logger.info(
      { emailId, to, subject, status: 'delivered' },
      'SendGridService.send: email sent successfully'
    );

    return { id: emailId, raw: result };
  }

  async sendWithRetry({ to, subject, html }, maxRetries = 2) {
    const errors = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.send({ to, subject, html });
        if (attempt > 0) {
          logger.info({ attempt, emailId: result.id }, 'SendGridService: succeeded on retry');
        }
        return result;
      } catch (err) {
        errors.push({ message: err.message, code: err.code, statusCode: err.statusCode, attempt });

        if (err.code === 'CONFIG_ERROR' || err.code === 'VALIDATION_ERROR') {
          throw err;
        }

        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          logger.warn(
            { attempt, maxRetries, backoffMs: backoff, errMsg: err.message },
            'SendGridService.sendWithRetry: retrying after error'
          );
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    const lastErr = errors[errors.length - 1];
    throw new SendGridError(
      `Failed after ${maxRetries + 1} attempts: ${lastErr.message}`,
      lastErr.code || 'RETRY_EXHAUSTED',
      lastErr.statusCode
    );
  }

  async verify() {
    const info = {
      configured: false,
      verified: false,
      apiKeyPresent: false,
      fromConfigured: false,
      from: this.from,
      sdkVersion: this.sdkVersion,
      message: null,
    };

    if (!this.apiKey) {
      info.message = 'SENDGRID_API_KEY not set';
      return info;
    }

    info.apiKeyPresent = true;

    if (!this.from) {
      info.message = 'SENDGRID_FROM_EMAIL not set';
      return info;
    }

    info.fromConfigured = true;

    if (!this.ready) {
      info.message = 'SendGrid client failed to initialize';
      return info;
    }

    try {
      const result = await this.send({
        to: 'test@sendgrid.com',
        subject: 'TakeUForward Email Health Check',
        html: `<p>Health check from TakeUForward server at ${new Date().toISOString()}.</p>`
      });

      info.configured = true;
      info.verified = true;
      info.emailId = result.id;
      info.message = 'Email service is operational';
      return info;
    } catch (err) {
      info.configured = true;
      info.verified = false;
      info.message = err.message;
      return info;
    }
  }
}

const sendGridService = new SendGridService();

export default sendGridService;