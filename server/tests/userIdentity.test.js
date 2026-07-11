import { deriveHandleFromEmail, isSystemAdminEmail, SYSTEM_ADMIN_EMAIL } from '../utils/userIdentity.js';

describe('user identity helpers', () => {
  it('uses @admin for the fixed system admin account', () => {
    expect(isSystemAdminEmail(SYSTEM_ADMIN_EMAIL)).toBe(true);
    expect(deriveHandleFromEmail(SYSTEM_ADMIN_EMAIL)).toBe('admin');
  });

  it('uses the email local-part as the mention handle for normal users', () => {
    expect(deriveHandleFromEmail('tushyent2410053@ssn.edu.in')).toBe('tushyent2410053');
    expect(deriveHandleFromEmail('codingclub@ssn.edu.in')).toBe('codingclub');
  });
});
