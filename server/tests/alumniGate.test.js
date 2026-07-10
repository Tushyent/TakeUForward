import { requireApprovedUser } from '../middleware/requireApprovedUser.js';

describe('requireApprovedUser middleware', () => {
  it('BLOCKS unverified alumni on non-auth routes', async () => {
    // We call the middleware directly since supertest can't inject req.user
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'alumni', isVerifiedAlumni: false },
      originalUrl: '/api/posts/test'
    };
    const mockRes = {
      status: (code) => {
        expect(code).toBe(403);
        return { json: (body) => {
          expect(body.error.message).toContain('pending alumni verification');
        }};
      }
    };
    requireApprovedUser(mockReq, mockRes, () => {
      throw new Error('Should not reach next()');
    });
  });

  it('ALLOWS unverified alumni on /api/auth routes', async () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'alumni', isVerifiedAlumni: false },
      originalUrl: '/api/auth/me'
    };
    requireApprovedUser(mockReq, { status: () => ({ json: () => {} }) }, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('ALLOWS verified alumni through', async () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'alumni', isVerifiedAlumni: true },
      originalUrl: '/api/posts/test'
    };
    requireApprovedUser(mockReq, { status: () => ({ json: () => {} }) }, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('ALLOWS students through', async () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'student', isVerifiedAlumni: false },
      originalUrl: '/api/posts/test'
    };
    requireApprovedUser(mockReq, { status: () => ({ json: () => {} }) }, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });

  it('ALLOWS club_admin through', async () => {
    let calledNext = false;
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'club_admin', isVerifiedAlumni: false },
      originalUrl: '/api/posts/test'
    };
    requireApprovedUser(mockReq, { status: () => ({ json: () => {} }) }, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });
});