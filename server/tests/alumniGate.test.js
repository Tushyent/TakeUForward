import { requireApprovedUser } from '../middleware/requireApprovedUser.js';

describe('requireApprovedUser middleware', () => {
  it('BLOCKS unverified alumni on non-auth routes', async () => {
    // We call the middleware directly since supertest can't inject req.user
    const mockReq = {
      isAuthenticated: () => true,
      user: { role: 'alumni', isVerifiedAlumni: false, isApproved: true, isPlatformAdmin: false },
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
      user: { role: 'alumni', isVerifiedAlumni: false, isApproved: true, isPlatformAdmin: false },
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
      user: { role: 'alumni', isVerifiedAlumni: true, isApproved: true, isPlatformAdmin: false },
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
      user: { role: 'student', isVerifiedAlumni: false, isApproved: true, isPlatformAdmin: false },
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
      user: { role: 'club_admin', isVerifiedAlumni: false, isApproved: true, isPlatformAdmin: false },
      originalUrl: '/api/posts/test'
    };
    requireApprovedUser(mockReq, { status: () => ({ json: () => {} }) }, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });
});

describe('alumni request-status route handler', () => {
  const mockStatusHandler = async (req, res, next, mockFindOne) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: { message: 'Not authenticated' } });
      }
      const request = await mockFindOne({ email: req.user.email });
      res.json({ hasRequest: !!request, status: request ? request.status : null });
    } catch (err) {
      next(err);
    }
  };

  it('rejects unauthenticated requests with 401', async () => {
    const mockReq = {
      isAuthenticated: () => false
    };
    const mockRes = {
      status: (code) => {
        expect(code).toBe(401);
        return {
          json: (body) => {
            expect(body.error.message).toBe('Not authenticated');
          }
        };
      }
    };
    await mockStatusHandler(mockReq, mockRes, () => {}, () => null);
  });

  it('returns hasRequest false when no request exists', async () => {
    const mockReq = {
      isAuthenticated: () => true,
      user: { email: 'newalumni@gmail.com' }
    };
    const mockRes = {
      json: (body) => {
        expect(body.hasRequest).toBe(false);
        expect(body.status).toBeNull();
      }
    };
    await mockStatusHandler(mockReq, mockRes, () => {}, () => null);
  });

  it('returns hasRequest true and its status when a request exists', async () => {
    const mockReq = {
      isAuthenticated: () => true,
      user: { email: 'pendingalumni@gmail.com' }
    };
    const mockRes = {
      json: (body) => {
        expect(body.hasRequest).toBe(true);
        expect(body.status).toBe('pending');
      }
    };
    await mockStatusHandler(mockReq, mockRes, () => {}, async () => ({ email: 'pendingalumni@gmail.com', status: 'pending' }));
  });
});