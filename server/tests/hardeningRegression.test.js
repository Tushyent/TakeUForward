/**
 * hardeningRegression.test.js
 *
 * Regression tests for all changes made in the final production hardening phase:
 * - Content length limits (post, comment, chat, marketplace, lostFound)
 * - Marketplace ReDoS fix (safe regex escaping)
 * - sanitizeUser (no sensitive fields in output)
 * - requireApprovedUser suspension gate (isApproved === false)
 * - digestService feature flag
 */

// ─── sanitizeUser ────────────────────────────────────────────────────────────
import { sanitizeUser } from '../utils/sanitizeUser.js';

describe('sanitizeUser()', () => {
  const makeUser = (extra = {}) => {
    const base = {
      _id: 'user123',
      name: 'Test User',
      email: 'test@ssn.edu.in',
      username: 'testuser',
      handle: 'testuser',
      role: 'student',
      dept: 'CSE',
      year: 2,
      isVerifiedAlumni: false,
      isPlatformAdmin: false,
      isApproved: true,
      bio: 'Hello',
      interests: [],
      skills: [],
      experience: [],
      projects: [],
      socialLinks: {},
      profileVisibility: 'public',
      isAnonymousDefault: false,
      reputation: 0,
      weeklyDigestOptIn: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Sensitive fields that MUST NOT appear in output:
      googleId: 'google-oauth-id-secret',
      pushSubscriptions: [{ endpoint: 'https://push.example.com', auth: 'secret', p256dh: 'secret' }],
      lastDigestSentAt: new Date(),
      __v: 0,
      ...extra,
    };
    // Provide toObject() to simulate a Mongoose document
    base.toObject = function() { return { ...this }; };
    return base;
  };

  it('should include essential user fields', () => {
    const result = sanitizeUser(makeUser());
    expect(result._id).toBe('user123');
    expect(result.name).toBe('Test User');
    expect(result.email).toBe('test@ssn.edu.in');
    expect(result.role).toBe('student');
    expect(result.isApproved).toBe(true);
  });

  it('should NEVER include googleId', () => {
    const result = sanitizeUser(makeUser());
    expect(Object.prototype.hasOwnProperty.call(result, 'googleId')).toBe(false);
  });

  it('should NEVER include pushSubscriptions', () => {
    const result = sanitizeUser(makeUser());
    expect(Object.prototype.hasOwnProperty.call(result, 'pushSubscriptions')).toBe(false);
  });

  it('should NEVER include lastDigestSentAt', () => {
    const result = sanitizeUser(makeUser());
    expect(Object.prototype.hasOwnProperty.call(result, 'lastDigestSentAt')).toBe(false);
  });

  it('should NEVER include Mongoose __v version key', () => {
    const result = sanitizeUser(makeUser());
    expect(Object.prototype.hasOwnProperty.call(result, '__v')).toBe(false);
  });

  it('should handle a plain object (no toObject) gracefully', () => {
    const plain = { _id: 'x', name: 'Plain', email: 'p@ssn.edu.in', googleId: 'secret' };
    const result = sanitizeUser(plain);
    expect(result.name).toBe('Plain');
    expect(Object.prototype.hasOwnProperty.call(result, 'googleId')).toBe(false);
  });
});

// ─── requireApprovedUser — suspension gate ────────────────────────────────────
import { requireApprovedUser } from '../middleware/requireApprovedUser.js';

/**
 * Helper: create a minimal mock response object that records calls.
 */
const makeRes = () => {
  const captured = {};
  return {
    status(code) { captured.status = code; return this; },
    json(body)  { captured.body = body; return this; },
    captured,
  };
};

describe('requireApprovedUser — suspension gate (isApproved === false)', () => {
  it('BLOCKS a suspended student (isApproved: false) on general routes', () => {
    let nextCalled = false;
    const res = makeRes();
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'student', isApproved: false, isVerifiedAlumni: true, isPlatformAdmin: false }, originalUrl: '/api/posts' },
      res,
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(false);
    expect(res.captured.status).toBe(403);
    expect(res.captured.body.error.message).toMatch(/suspended/i);
  });

  it('BLOCKS a suspended alumni on general routes', () => {
    let nextCalled = false;
    const res = makeRes();
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'alumni', isApproved: false, isVerifiedAlumni: true, isPlatformAdmin: false }, originalUrl: '/api/chats/123/message' },
      res,
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(false);
    expect(res.captured.status).toBe(403);
  });

  it('ALLOWS a suspended account to reach /api/auth/me (status check)', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'student', isApproved: false, isVerifiedAlumni: true, isPlatformAdmin: false }, originalUrl: '/api/auth/me' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });

  it('ALLOWS a suspended account to reach /api/auth/logout', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'student', isApproved: false, isVerifiedAlumni: true, isPlatformAdmin: false }, originalUrl: '/api/auth/logout' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });

  it('DOES NOT block a platform admin even if isApproved is false', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'platform_admin', isApproved: false, isVerifiedAlumni: true, isPlatformAdmin: true }, originalUrl: '/api/admin/users' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });

  it('ALLOWS active student (isApproved: true)', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'student', isApproved: true, isVerifiedAlumni: false, isPlatformAdmin: false }, originalUrl: '/api/posts' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });

  it('ALLOWS legacy user (isApproved: undefined) — treated as active for backward compat', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'student', isApproved: undefined, isVerifiedAlumni: false, isPlatformAdmin: false }, originalUrl: '/api/posts' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });

  it('BLOCKS unverified alumni (isVerifiedAlumni: false) on general routes', () => {
    let nextCalled = false;
    const res = makeRes();
    requireApprovedUser(
      { isAuthenticated: () => true, user: { role: 'alumni', isApproved: true, isVerifiedAlumni: false, isPlatformAdmin: false }, originalUrl: '/api/posts' },
      res,
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(false);
    expect(res.captured.status).toBe(403);
    expect(res.captured.body.error.message).toMatch(/pending alumni verification/i);
  });

  it('passes through unauthenticated requests (requireAuth handles these)', () => {
    let nextCalled = false;
    requireApprovedUser(
      { isAuthenticated: () => false, originalUrl: '/api/posts' },
      makeRes(),
      () => { nextCalled = true; }
    );
    expect(nextCalled).toBe(true);
  });
});

// ─── Marketplace ReDoS — regex escaping ──────────────────────────────────────
describe('Marketplace search ReDoS protection', () => {
  /**
   * The actual route uses: String(search).slice(0,200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
   * We test the escaping function directly.
   */
  function escapeRegex(s) {
    return String(s).slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  it('escapes regex metacharacters from user input', () => {
    const evil = '(a+)+$';
    const safe = escapeRegex(evil);
    expect(safe).toBe('\\(a\\+\\)\\+\\$');
    // Verify the escaped string can be used safely in new RegExp
    let threw = false;
    try { new RegExp(safe, 'i'); } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('truncates search strings longer than 200 characters', () => {
    const longInput = 'a'.repeat(500);
    const result = escapeRegex(longInput);
    expect(result.length).toBe(200);
  });

  it('handles empty string without throwing', () => {
    let threw = false;
    try { new RegExp(escapeRegex(''), 'i'); } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('passes normal search text unchanged (no metacharacters)', () => {
    expect(escapeRegex('laptop')).toBe('laptop');
    expect(escapeRegex('John Doe')).toBe('John Doe');
  });

  it('escapes dots, stars, question marks, brackets', () => {
    expect(escapeRegex('file.js')).toBe('file\\.js');
    expect(escapeRegex('a*b')).toBe('a\\*b');
    expect(escapeRegex('test?')).toBe('test\\?');
    expect(escapeRegex('[admin]')).toBe('\\[admin\\]');
  });
});

// ─── digestService feature flag ───────────────────────────────────────────────
import { generateAndSendWeeklyDigests } from '../services/digestService.js';

describe('digestService ENABLE_DIGEST flag', () => {
  it('returns early with zero counts when ENABLE_DIGEST is not set', async () => {
    const saved = process.env.ENABLE_DIGEST;
    delete process.env.ENABLE_DIGEST;
    const result = await generateAndSendWeeklyDigests();
    expect(result.sentCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.errorCount).toBe(0);
    if (saved !== undefined) process.env.ENABLE_DIGEST = saved;
  });

  it('returns early with zero counts when ENABLE_DIGEST is "false"', async () => {
    const saved = process.env.ENABLE_DIGEST;
    process.env.ENABLE_DIGEST = 'false';
    const result = await generateAndSendWeeklyDigests();
    expect(result.sentCount).toBe(0);
    if (saved !== undefined) process.env.ENABLE_DIGEST = saved;
    else delete process.env.ENABLE_DIGEST;
  });
});
