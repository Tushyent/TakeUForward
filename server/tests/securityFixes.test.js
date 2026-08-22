/**
 * @file securityFixes.test.js
 * @description Unit and integration tests for security fixes (SSRF, CORS, CSRF, BOLA, Global Auth).
 */

import { validateS3Url } from '../utils/urlValidator.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { csrfProtection } from '../middleware/csrfProtection.js';

describe('SSRF validateS3Url utility checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows valid S3 URL in production/live mode', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test_key';
    process.env.AWS_BUCKET_NAME = 'tuf-ssn-bucket';
    process.env.AWS_REGION = 'us-east-1';

    const validUrl = 'https://tuf-ssn-bucket.s3.us-east-1.amazonaws.com/resources/12345-notes.pdf';
    expect(validateS3Url(validUrl)).toBe(true);
  });

  it('blocks S3 URLs pointing to other buckets or incorrect regions', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test_key';
    process.env.AWS_BUCKET_NAME = 'tuf-ssn-bucket';
    process.env.AWS_REGION = 'us-east-1';

    const badBucket = 'https://malicious-bucket.s3.us-east-1.amazonaws.com/resources/12345-notes.pdf';
    const badRegion = 'https://tuf-ssn-bucket.s3.us-west-2.amazonaws.com/resources/12345-notes.pdf';

    expect(validateS3Url(badBucket)).toBe(false);
    expect(validateS3Url(badRegion)).toBe(false);
  });

  it('blocks external host URLs (SSRF vectors)', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test_key';
    process.env.AWS_BUCKET_NAME = 'tuf-ssn-bucket';
    
    const badUrls = [
      'http://127.0.0.1/resources/test.pdf',
      'http://localhost/resources/test.pdf',
      'http://0.0.0.0/resources/test.pdf',
      'http://[::1]/resources/test.pdf',
      'http://169.254.169.254/latest/meta-data/',
      'http://2852039166/resources/test.pdf', // Decimal IP
      'http://0xA9FEA9FE/resources/test.pdf', // Hex IP
      'https://user:pass@tuf-ssn-bucket.s3.us-east-1.amazonaws.com/resources/test.pdf', // Inline credentials
      'https://tuf-ssn-bucket.s3.us-east-1.amazonaws.com:8080/resources/test.pdf', // Unexpected port
      'https://attacker.com/tuf-ssn-bucket.s3.amazonaws.com/resources/test.pdf', // Wrong hostname
      'https://tuf-ssn-bucket.s3.us-east-1.amazonaws.com/not-resources/test.pdf' // Wrong path
    ];

    for (const url of badUrls) {
      expect(validateS3Url(url)).toBe(false);
    }
  });

  it('allows local mock S3 URL in test mode without AWS credentials', () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    process.env.NODE_ENV = 'test';

    const mockUrl = 'http://localhost:5000/mock-s3/12345-notes.pdf';
    expect(validateS3Url(mockUrl)).toBe(true);
  });
});

describe('Global requireAuth middleware checks', () => {
  it('blocks unauthenticated requests returning 401 status', () => {
    const mockReq = {
      isAuthenticated: () => false,
      path: '/api/posts'
    };
    const mockRes = {
      status: (code) => {
        expect(code).toBe(401);
        return {
          json: (body) => {
            expect(body.error.message).toContain('Not authenticated');
          }
        };
      }
    };
    requireAuth(mockReq, mockRes, () => {
      throw new Error('Should not reach next()');
    });
  });

  it('allows authenticated requests to pass through', () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => true,
      path: '/api/posts'
    };
    requireAuth(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('bypasses /health check endpoint regardless of authentication status', () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => false,
      path: '/health',
      originalUrl: '/health'
    };
    requireAuth(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });
});

describe('CSRF protection middleware checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('bypasses safe request methods (GET, HEAD, OPTIONS)', () => {
    let calledNext = false;
    const mockReq = {
      method: 'GET',
      headers: {}
    };
    csrfProtection(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('bypasses weekly-digest cron webhook path', () => {
    let calledNext = false;
    const mockReq = {
      method: 'POST',
      path: '/api/jobs/weekly-digest',
      headers: {}
    };
    csrfProtection(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('blocks requests missing both Origin and Referer headers with 403 status', () => {
    const mockReq = {
      method: 'POST',
      path: '/api/posts',
      headers: {}
    };
    const mockRes = {
      status: (code) => {
        expect(code).toBe(403);
        return {
          json: (body) => {
            expect(body.error.message).toContain('Missing Origin or Referer');
          }
        };
      }
    };
    csrfProtection(mockReq, mockRes, () => {
      throw new Error('Should not reach next()');
    });
  });

  it('allows matching allowed origin or referer', () => {
    process.env.CLIENT_URL = 'https://takeuforward.blastorz.fun';
    let calledNext = false;
    const mockReq = {
      method: 'POST',
      path: '/api/posts',
      headers: {
        origin: 'https://takeuforward.blastorz.fun'
      }
    };
    csrfProtection(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('allows safe Vite local dev server origins', () => {
    let calledNext = false;
    const mockReq = {
      method: 'POST',
      path: '/api/posts',
      headers: {
        origin: 'http://localhost:5173'
      }
    };
    csrfProtection(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('allows Vercel preview domains strictly under project scope', () => {
    let calledNext = false;
    const mockReq = {
      method: 'POST',
      path: '/api/posts',
      headers: {
        origin: 'https://takeuforward-git-main-tushyents-projects.vercel.app'
      }
    };
    csrfProtection(mockReq, {}, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('blocks Vercel preview domains under foreign scopes (CORS/CSRF hijack vectors)', () => {
    const mockReq = {
      method: 'POST',
      path: '/api/posts',
      headers: {
        origin: 'https://takeuforward-attacker-projects.vercel.app'
      }
    };
    const mockRes = {
      status: (code) => {
        expect(code).toBe(403);
        return {
          json: (body) => {
            expect(body.error.message).toContain('Unauthorized request origin');
          }
        };
      }
    };
    csrfProtection(mockReq, mockRes, () => {
      throw new Error('Should not reach next()');
    });
  });
});

import { sanitizeQuery } from '../middleware/sanitizeQuery.js';

describe('NoSQL Query Parameter Sanitization checks', () => {
  it('casts nested query parameter objects to safe strings', () => {
    const mockReq = {
      query: {
        category: { $ne: 'other' },
        status: 'open',
        search: ['a', 'b']
      }
    };
    sanitizeQuery(mockReq, {}, () => {});

    expect(typeof mockReq.query.category).toBe('string');
    expect(mockReq.query.category).toBe('[object Object]');
    expect(mockReq.query.status).toBe('open');
    expect(typeof mockReq.query.search).toBe('string');
    expect(mockReq.query.search).toBe('a,b');
  });

  it('ignores non-object query definitions gracefully', () => {
    const mockReq = { query: null };
    sanitizeQuery(mockReq, {}, () => {});
    expect(mockReq.query).toBeNull();
  });
});
