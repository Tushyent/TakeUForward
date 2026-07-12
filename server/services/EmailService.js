import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

export class EmailError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'EmailError';
    this.code = code || 'UNKNOWN';
    this.statusCode = statusCode || null;
  }
}

class EmailService {
  constructor() {
    this.resend = null;
    this.from = null;
    this.apiKey = null;
    this.ready = false;
    this.sdkVersion = '6.17.2';

    this._init();
  }

  _init() {
    this.apiKey = process.env.RESEND_API_KEY || null;
    this.from = process.env.EMAIL_FROM || null;

    if (!this.apiKey) {
      logger.warn('EmailService: RESEND_API_KEY not set — all email sending disabled.');
      return;
    }

    if (!this.from) {
      this.from = 'onboarding@resend.dev';
      logger.warn(
        'EmailService: EMAIL_FROM not set — using %s. '
        + 'Resend sandbox only delivers to the verified account email. '
        + 'Set EMAIL_FROM to a verified domain for production.',
        this.from
      );
    }

    try {
      this.resend = new Resend(this.apiKey);
      this.ready = true;
      logger.info('EmailService: initialized (from=%s, sdk=%s)', this.from, this.sdkVersion);
    } catch (err) {
      logger.error({ err }, 'EmailService: failed to initialize Resend client');
    }
  }

  async send({ to, subject, html }) {
    if (this.ready && !process.env.RESEND_API_KEY) {
      this.ready = false;
      this.resend = null;
      logger.warn('EmailService: RESEND_API_KEY was removed from environment — deinitialized.');
    }

    if (!this.ready) {
      throw new EmailError(
        'EmailService not initialized — set RESEND_API_KEY environment variable',
        'CONFIG_ERROR'
      );
    }

    if (!to) {
      throw new EmailError('Recipient email (to) is required', 'VALIDATION_ERROR', 400);
    }

    if (!subject) {
      throw new EmailError('Email subject is required', 'VALIDATION_ERROR', 400);
    }

    if (!html) {
      throw new EmailError('Email HTML body is required', 'VALIDATION_ERROR', 400);
    }

    const payload = { from: this.from, to, subject, html };

    logger.info(
      { from: this.from, to, subject },
      'EmailService.send: sending email'
    );

    let result;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      result = await this.resend.emails.send(payload, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new EmailError('Email send timed out after 15s', 'TIMEOUT');
      }
      throw new EmailError(err.message, err.code || 'NETWORK_ERROR');
    }

    if (result.error) {
      throw new EmailError(
        result.error.message || 'Unknown Resend error',
        result.error.name || 'RESEND_ERROR',
        result.error.statusCode || null
      );
    }

    const emailId = result.data?.id || null;
    logger.info(
      { emailId, to, subject, status: 'delivered' },
      'EmailService.send: email sent successfully'
    );

    return { id: emailId, raw: result };
  }

  async sendWithRetry({ to, subject, html }, maxRetries = 2) {
    const errors = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.send({ to, subject, html });
        if (attempt > 0) {
          logger.info({ attempt, emailId: result.id }, 'EmailService: succeeded on retry');
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
            'EmailService.sendWithRetry: retrying after error'
          );
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    const lastErr = errors[errors.length - 1];
    throw new EmailError(
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
      info.message = 'RESEND_API_KEY not set';
      return info;
    }

    info.apiKeyPresent = true;

    if (!this.from) {
      info.message = 'EMAIL_FROM not set';
      return info;
    }

    info.fromConfigured = true;

    if (!this.ready || !this.resend) {
      info.message = 'Resend client failed to initialize';
      return info;
    }

    try {
      const result = await this.send({
        to: 'test@resend.dev',
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

const emailService = new EmailService();

export default emailService;
